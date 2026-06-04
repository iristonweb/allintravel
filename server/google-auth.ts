import type { Express, Request, Response } from "express";
import * as client from "openid-client";
import passport from "passport";
import { storage } from "./storage";
import type { SessionUser } from "./auth";

let googleConfig: client.Configuration | null = null;

function getAppBaseUrl(): string {
  return process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
}

async function getGoogleConfig(): Promise<client.Configuration | null> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  if (!googleConfig) {
    googleConfig = await client.discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID,
      { client_secret: process.env.GOOGLE_CLIENT_SECRET },
    );
  }
  return googleConfig;
}

export async function setupGoogleAuth(app: Express): Promise<void> {
  let config: client.Configuration | null = null;
  try {
    config = await getGoogleConfig();
  } catch (err) {
    console.error("[auth] Google discovery failed:", err);
    return;
  }
  if (!config) {
    console.log("[auth] Google OAuth not configured (missing GOOGLE_CLIENT_ID/SECRET)");
    return;
  }

  const redirectUri = `${getAppBaseUrl()}/api/auth/google/callback`;

  app.get("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      (req.session as unknown as Record<string, unknown>).oauthCodeVerifier = codeVerifier;

      const rawRedirect = typeof req.query.state === "string" ? req.query.state : "/";
      const oauthState =
        rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://")
          ? rawRedirect
          : "/";

      const authUrl = client.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri,
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: oauthState,
      });

      res.redirect(authUrl.href);
    } catch (err) {
      console.error("Google auth start error:", err);
      res.redirect("/login?error=invalid");
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const codeVerifier = (req.session as unknown as Record<string, unknown>).oauthCodeVerifier as string | undefined;
      if (!codeVerifier) {
        return res.redirect("/login?error=invalid");
      }

      const currentUrl = new URL(`${getAppBaseUrl()}${req.originalUrl}`);
      const tokens = await client.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
      });

      const claims = tokens.claims();
      const email = (claims?.email as string | undefined)?.trim().toLowerCase();
      if (!email) {
        return res.redirect("/login?error=invalid");
      }

      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.upsertUser({
          id: crypto.randomUUID(),
          email,
          firstName: (claims?.given_name as string) ?? null,
          lastName: (claims?.family_name as string) ?? null,
          profileImageUrl: (claims?.picture as string) ?? null,
        });
      }

      const sessionUser: SessionUser = {
        claims: {
          sub: user.id,
          email: user.email ?? undefined,
          first_name: user.firstName ?? undefined,
          last_name: user.lastName ?? undefined,
          profile_image_url: user.profileImageUrl ?? undefined,
        },
      };

      delete (req.session as unknown as Record<string, unknown>).oauthCodeVerifier;

      req.logIn(sessionUser, (err) => {
        if (err) {
          console.error("Google login session error:", err);
          return res.redirect("/login?error=invalid");
        }
        const rawRedirect = typeof req.query.state === "string" ? req.query.state : "/";
        const safeRedirect =
          rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
        res.redirect(safeRedirect);
      });
    } catch (err) {
      console.error("Google auth callback error:", err);
      res.redirect("/login?error=invalid");
    }
  });

  console.log("[auth] Google OAuth enabled");
}

export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
