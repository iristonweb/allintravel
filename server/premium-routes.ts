import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";
import { PREMIUM_PLANS } from "@shared/premium";
import { purchasePremiumWithAit } from "./premium";
import { toSelfUser } from "./user-utils";
import { isPremiumActive } from "./admin";

export function registerPremiumRoutes(app: Express): void {
  app.get("/api/premium/plans", (_req, res) => {
    res.json({
      plans: PREMIUM_PLANS.map((p) => ({
        id: p.id,
        costAit: p.costAit,
        durationDays: p.durationDays,
        titleKey: p.titleKey,
        titleDefault: p.titleDefault,
        descriptionKey: p.descriptionKey,
        descriptionDefault: p.descriptionDefault,
      })),
    });
  });

  app.post("/api/premium/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const body = z
        .object({
          planId: z.enum(["month", "year", "lifetime"]),
          idempotencyKey: z.string().min(8).max(80).optional(),
        })
        .parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const result = await purchasePremiumWithAit(storage, user, body.planId, {
        idempotencyKey: body.idempotencyKey,
      });
      if (!result.ok) {
        return res.status(400).json({ message: result.message ?? "Purchase failed" });
      }

      res.json({
        ok: true,
        user: toSelfUser(result.user!),
        isPremium: isPremiumActive(result.user!.premiumUntil),
        premiumUntil: result.user!.premiumUntil,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan", issues: error.issues });
      }
      console.error("premium purchase:", error);
      res.status(500).json({ message: "Purchase failed" });
    }
  });
}
