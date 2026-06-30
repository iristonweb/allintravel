import { sql } from "drizzle-orm";
import { BOOST_QS_REJECT_THRESHOLD, boostPriceMultiplier } from "@shared/ait";
import { getDb } from "../../db";
import { storage } from "../../storage";

export type QualityScoreBreakdown = {
  score: number;
  engagement: number;
  trust: number;
  boostHistory: number;
  relevance: number;
};

export async function getAuthorTrustScore(userId: string): Promise<number> {
  const db = getDb();
  if (!db) return 50;
  const res = await db.execute(sql`
    SELECT trust_score FROM user_trust_scores WHERE user_id = ${userId} LIMIT 1
  `);
  const raw = (res as unknown as { rows?: { trust_score: number }[] }).rows?.[0]?.trust_score;
  return Math.min(100, Math.max(0, Number(raw ?? 50)));
}

async function getPostEngagementScore(postId: string): Promise<number> {
  const likes = await storage.getPostLikesCount(postId);
  const comments = await storage.getPostCommentsCount(postId);
  const rate = Math.min(100, likes * 2 + comments * 5);
  return rate;
}

async function getBoostHistoryScore(userId: string): Promise<number> {
  const db = getDb();
  if (!db) return 60;
  const res = await db.execute(sql`
    SELECT coalesce(avg(
      CASE WHEN impressions > 0 THEN least(100, (clicks::float / impressions) * 500) ELSE 50 END
    ), 60)::int AS avg_score
    FROM ait_boost_campaigns
    WHERE user_id = ${userId} AND status IN ('active', 'completed')
  `);
  return Number((res as unknown as { rows?: { avg_score: number }[] }).rows?.[0]?.avg_score ?? 60);
}

export async function computeQualityScore(
  postId: string,
  authorId: string,
  viewerId?: string | null,
): Promise<QualityScoreBreakdown> {
  const engagement = await getPostEngagementScore(postId);
  const trust = await getAuthorTrustScore(authorId);
  const boostHistory = await getBoostHistoryScore(authorId);

  let relevance = 50;
  if (viewerId && viewerId !== authorId) {
    const viewerTrips = await storage.getTrips({ userId: viewerId, limit: 5 });
    const post = await storage.getTravelPost(postId);
    const postLoc = (post?.location ?? "").toLowerCase();
    if (postLoc) {
      const match = viewerTrips.some((t) =>
        t.destination.toLowerCase().includes(postLoc.split(",")[0] ?? ""),
      );
      relevance = match ? 85 : 40;
    }
  }

  const score = Math.round(engagement * 0.4 + relevance * 0.3 + trust * 0.2 + boostHistory * 0.1);

  return {
    score: Math.min(100, Math.max(0, score)),
    engagement,
    trust,
    boostHistory,
    relevance,
  };
}

export function isBoostAllowed(qs: number): boolean {
  return qs >= BOOST_QS_REJECT_THRESHOLD;
}

export function computeBoostCost(
  baseCost: number,
  qs: number,
  experienceMultiplier: number,
): number {
  return Math.max(1, Math.floor(baseCost * boostPriceMultiplier(qs) * experienceMultiplier));
}
