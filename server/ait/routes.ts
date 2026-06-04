import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import {
  claimWeeklyQuest,
  getAitDashboard,
  onDailyPulse,
  spendCatalogItem,
  tipPost,
  tipUser,
} from "./service";
import { storage } from "../storage";
import { getCreatorFundStatus } from "./creator-fund";
import { grantTripCinemaWatch } from "./cinema";
import { grantTripCheckin } from "./checkin";
import { tryClaimRingsWeeklyBonus } from "./rings-bonus";
import { getWeeklyCreatorLeaderboard } from "./leaderboard";
import { applyReferralCode, getReferralInfo } from "./referral";
import type { AitGrantResult } from "./service";

function mergeGrants(...grants: (AitGrantResult | null | undefined)[]): AitGrantResult | null {
  for (const g of grants) {
    if (g?.granted && g.amount) return g;
  }
  return null;
}

export function registerAitRoutes(app: Express): void {
  app.get("/api/ait", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const pulseGrants = await onDailyPulse(userId);
      const ringsGrant = await tryClaimRingsWeeklyBonus(userId);
      const dashboard = await getAitDashboard(userId);
      res.json({
        ...dashboard,
        pulseGrants,
        aitGrant: mergeGrants(ringsGrant, ...pulseGrants) ?? null,
      });
    } catch (error) {
      console.error("GET /api/ait", error);
      res.status(500).json({ message: "Failed to load AIT" });
    }
  });

  app.get("/api/ait/ledger", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const dashboard = await getAitDashboard(userId);
      res.json({ ledger: dashboard.ledger });
    } catch (error) {
      res.status(500).json({ message: "Failed to load ledger" });
    }
  });

  app.get("/api/ait/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const limit = Math.min(20, Math.max(5, Number(req.query.limit) || 10));
      const entries = await getWeeklyCreatorLeaderboard(limit);
      const enriched = await Promise.all(
        entries.map(async (e) => {
          const user = await storage.getUser(e.userId);
          return {
            ...e,
            displayName: user
              ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
              : "Путешественник",
            profileImageUrl: user?.profileImageUrl ?? null,
            username: user?.username ?? null,
          };
        }),
      );
      res.json({ period: "week", entries: enriched });
    } catch (error) {
      console.error("GET /api/ait/leaderboard", error);
      res.status(500).json({ message: "Failed to load leaderboard" });
    }
  });

  app.get("/api/ait/referral", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const info = await getReferralInfo(userId);
      res.json(info);
    } catch (error) {
      res.status(500).json({ message: "Failed to load referral" });
    }
  });

  app.post("/api/ait/referral/apply", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const { code } = z.object({ code: z.string().min(4).max(16) }).parse(req.body);
      const result = await applyReferralCode(userId, code);
      if (!result.ok) return res.status(400).json({ message: result.message });
      res.json({ ok: true, aitGrant: result.grant ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid code" });
      }
      res.status(500).json({ message: "Referral failed" });
    }
  });

  app.post("/api/ait/spend", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const body = z
        .object({
          sku: z.string().min(1),
          postId: z.string().uuid().optional(),
        })
        .parse(req.body);

      if (body.sku === "boost_post_24h") {
        if (!body.postId) return res.status(400).json({ message: "Укажите postId" });
        const post = await storage.getTravelPost(body.postId);
        if (!post?.userId || post.userId !== userId) {
          return res.status(403).json({ message: "Можно бустить только свои посты" });
        }
      }

      const result = await spendCatalogItem(userId, body.sku, { postId: body.postId });
      if (!result.ok) return res.status(400).json({ message: result.message });
      const dashboard = await getAitDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid body" });
      }
      res.status(500).json({ message: "Purchase failed" });
    }
  });

  app.post("/api/ait/quests/:questId/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const result = await claimWeeklyQuest(userId, req.params.questId);
      if (!result.ok) return res.status(400).json({ message: result.message });
      const dashboard = await getAitDashboard(userId);
      res.json({ ...dashboard, aitGrant: result.grant ?? null, lastGrant: result.grant ?? null });
    } catch (error) {
      res.status(500).json({ message: "Claim failed" });
    }
  });

  app.post("/api/ait/tip", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const body = z
        .object({
          postId: z.string().uuid().optional(),
          userId: z.string().optional(),
          amount: z.number().int().positive(),
        })
        .parse(req.body);

      if (body.postId) {
        const post = await storage.getTravelPost(body.postId);
        if (!post?.userId) return res.status(404).json({ message: "Post not found" });
        const result = await tipPost(userId, body.postId, body.amount, post.userId);
        if (!result.ok) return res.status(400).json({ message: result.message });
        const dashboard = await getAitDashboard(userId);
        return res.json({ ...dashboard, aitGrant: result.grant ?? null, lastGrant: result.grant ?? null });
      }

      if (body.userId) {
        const result = await tipUser(userId, body.userId, body.amount);
        if (!result.ok) return res.status(400).json({ message: result.message });
        const dashboard = await getAitDashboard(userId);
        return res.json({ ...dashboard, aitGrant: result.grant ?? null, lastGrant: result.grant ?? null });
      }

      return res.status(400).json({ message: "Укажите postId или userId" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tip" });
      }
      res.status(500).json({ message: "Tip failed" });
    }
  });

  app.get("/api/ait/creator-fund", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const status = await getCreatorFundStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("GET /api/ait/creator-fund", error);
      res.status(500).json({ message: "Failed to load creator fund" });
    }
  });

  app.post("/api/trips/:id/cinema/watch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const aitGrant = await grantTripCinemaWatch(userId, trip.id);
      res.json({ ok: true, aitGrant: aitGrant ?? null });
    } catch (error) {
      console.error("POST cinema watch", error);
      res.status(500).json({ message: "Failed to record watch" });
    }
  });

  app.post("/api/trips/:id/checkin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const aitGrant = await grantTripCheckin(userId, trip.id);
      res.json({ ok: true, aitGrant: aitGrant ?? null, alreadyCheckedIn: !aitGrant });
    } catch (error) {
      console.error("POST trip checkin", error);
      res.status(500).json({ message: "Check-in failed" });
    }
  });
}

export type { AitGrantResult };
