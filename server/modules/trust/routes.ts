import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../../auth";
import { storage } from "../../storage";
import { addVouch, getTrustProfile, hasVouched, recalculateTrust } from "./service";

export function registerTrustRoutes(app: Express): void {
  app.get("/api/trust/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const profile = await getTrustProfile(storage, userId);
      res.json(profile);
    } catch (error) {
      console.error("trust/me:", error);
      res.status(500).json({ message: "Failed to load trust profile" });
    }
  });

  app.get("/api/trust/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const viewerId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const targetId = req.params.userId;
      const profile = await getTrustProfile(storage, targetId);
      const vouched = await hasVouched(viewerId, targetId);
      res.json({ ...profile, vouchedByMe: vouched });
    } catch (error) {
      console.error("trust/user:", error);
      res.status(500).json({ message: "Failed to load trust profile" });
    }
  });

  app.post("/api/trust/:userId/vouch", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const fromUserId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const toUserId = req.params.userId;
      const message =
        typeof req.body?.message === "string" ? req.body.message.slice(0, 280) : undefined;
      const result = await addVouch(fromUserId, toUserId, message);
      if (!result.ok) {
        return res
          .status(result.reason === "duplicate" ? 409 : 400)
          .json({ message: result.reason });
      }
      const profile = await recalculateTrust(storage, toUserId);
      res.json(profile);
    } catch (error) {
      console.error("trust/vouch:", error);
      res.status(500).json({ message: "Failed to vouch" });
    }
  });
}
