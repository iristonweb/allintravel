import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../../auth";
import { storage } from "../../storage";
import { getPassportForUser } from "./service";
import { canViewProfile } from "../../privacy-helpers";
import { toPublicUser } from "../../user-utils";

export function registerPassportRoutes(app: Express): void {
  app.get("/api/passport/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const passport = await getPassportForUser(storage, userId);
      res.json(passport);
    } catch (error) {
      console.error("passport/me:", error);
      res.status(500).json({ message: "Failed to load passport" });
    }
  });

  app.get("/api/passport/user/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const viewerId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const targetId = req.params.userId;
      const target = await storage.getUser(targetId);
      if (!target) return res.status(404).json({ message: "User not found" });

      const settings = await storage.getPrivacySettings(targetId);
      const isFriend = await storage.areFriends(viewerId, targetId);
      if (!canViewProfile(settings, viewerId, targetId, isFriend)) {
        return res.status(403).json({ message: "Profile is private" });
      }

      const passport = await getPassportForUser(storage, targetId);
      res.json({ user: toPublicUser(target), ...passport });
    } catch (error) {
      console.error("passport/user:", error);
      res.status(500).json({ message: "Failed to load passport" });
    }
  });

  /** Public SEO endpoint for share cards */
  app.get("/api/passport/public/:username", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) return res.status(404).json({ message: "User not found" });
      const passport = await getPassportForUser(storage, user.id);
      res.json({
        username: user.username,
        displayName: user.displayName ?? user.username,
        profileImageUrl: user.profileImageUrl,
        ...passport,
      });
    } catch (error) {
      console.error("passport/public:", error);
      res.status(500).json({ message: "Failed to load passport" });
    }
  });
}
