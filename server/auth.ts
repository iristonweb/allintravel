import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { setupGoogleAuth } from "./google-auth";
import { applyPassportMiddleware } from "./auth-middleware";
import { registerLocalPassportStrategy, registerLoginRoutes } from "./local-auth";
import { getAuthUserId } from "./types/authenticated-request";

export type { SessionUser } from "./auth-session";
export type { AuthenticatedRequest } from "./types/authenticated-request";
export { getAuthUserId } from "./types/authenticated-request";
export { applyPassportMiddleware, getSession } from "./auth-middleware";

export async function setupAuth(app: Express) {
  applyPassportMiddleware(app);
  registerLocalPassportStrategy();
  registerLoginRoutes(app);

  const googleSetup = setupGoogleAuth(app).catch((err) => {
    console.error("[auth] Google OAuth setup skipped:", err);
  });

  if (!process.env.VERCEL) {
    try {
      await Promise.race([
        googleSetup,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("Google OAuth setup timeout")), 10_000),
        ),
      ]);
    } catch (err) {
      console.error("[auth] Google OAuth setup skipped:", err);
    }
  }

  const handleLogout = (req: import("express").Request, res: import("express").Response) => {
    req.logout((err) => {
      if (err) return res.redirect("/");
      res.redirect("/");
    });
  };

  app.get("/api/logout", handleLogout);
  app.post("/api/logout", handleLogout);
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!getAuthUserId(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const dbUser = await storage.getUser(userId);
  if (!dbUser?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
