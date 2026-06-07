import express, { type Express, type Request, type Response } from "express";
import { applyPassportMiddleware } from "../auth-middleware";
import { registerLocalPassportStrategy, registerLoginRoutes } from "../local-auth";
import {
  authConfigPayload,
  ensureAuthInfrastructure,
  isSessionConfigured,
  publicAuthErrorMessage,
} from "../auth-readiness";
import { isGoogleAuthEnabled } from "../google-auth";

let authApp: Express | null = null;
let authReady: Promise<void> | null = null;

async function warmAuthInfrastructure(): Promise<void> {
  if (!authReady) {
    authReady = ensureAuthInfrastructure().catch((err) => {
      authReady = null;
      throw err;
    });
  }
  await authReady;
}

export function getAuthApp(): Express {
  if (authApp) return authApp;

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.get("/api/auth/config", (_req, res) => {
    res.json({
      ...authConfigPayload(),
      googleOAuth: isGoogleAuthEnabled(),
    });
  });
  applyPassportMiddleware(app);
  registerLocalPassportStrategy();
  registerLoginRoutes(app);

  authApp = app;
  return app;
}

export function isAuthLoginPath(method: string | undefined, url: string | undefined): boolean {
  if (method !== "POST" || !url) return false;
  const path = url.split("?")[0] ?? "";
  return path === "/api/login" || path === "/api/auth/login";
}

export function runAuthApp(req: Request, res: Response): Promise<void> {
  const run = async () => {
    if (!isSessionConfigured()) {
      if (!res.headersSent) {
        res.status(503).json({
          ok: false,
          error: "server",
          code: "NO_SESSION_SECRET",
          message: publicAuthErrorMessage("NO_SESSION_SECRET"),
        });
      }
      return;
    }

    try {
      await warmAuthInfrastructure();
    } catch (err) {
      const code =
        err instanceof Error && "code" in err && typeof err.code === "string"
          ? err.code
          : "SERVER";
      console.error("[auth-app] infrastructure warm failed:", err);
      if (!res.headersSent) {
        res.status(code === "NO_SESSION_SECRET" ? 503 : 500).json({
          ok: false,
          error: "server",
          code,
          message: publicAuthErrorMessage(code, err instanceof Error ? err.message : String(err)),
        });
      }
      return;
    }

    const app = getAuthApp();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      res.once("finish", done);
      res.once("close", done);
      res.once("error", (error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
      try {
        app(req, res, (error: unknown) => {
          if (error && !settled) {
            settled = true;
            reject(error);
          }
        });
      } catch (error) {
        if (!settled) {
          settled = true;
          reject(error);
        }
      }
    });
  };

  return run();
}
