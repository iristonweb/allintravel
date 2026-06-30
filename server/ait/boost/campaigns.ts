import { sql } from "drizzle-orm";
import {
  AIT_BOOST_BASE_COST,
  AIT_BOOST_MAX_PER_DAY,
  AIT_BURN_RATES,
} from "@shared/ait";
import { getDb } from "../../db";
import { storage } from "../../storage";
import * as store from "../store";
import { calculateBurnAmount, recordBurn } from "../burns";
import { checkProofOfExperience } from "./proof-of-experience";
import { computeBoostCost, computeQualityScore, isBoostAllowed } from "./quality-score";
import { addPostBoost } from "../perks";

const memCampaigns: {
  id: string;
  postId: string;
  userId: string;
  budgetAit: number;
  spentAit: number;
  qsAtLaunch: number;
  verifiedExperience: boolean;
  expiresAt: Date;
}[] = [];

function genCampaignId(): string {
  return `boost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function canLaunchBoost(
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  if (!db) {
    const todayCount = memCampaigns.filter(
      (c) => c.userId === userId && c.expiresAt.toISOString().slice(0, 10) === today,
    ).length;
    if (todayCount >= AIT_BOOST_MAX_PER_DAY) {
      return { ok: false, message: `Лимит ${AIT_BOOST_MAX_PER_DAY} буста в день` };
    }
    return { ok: true };
  }
  const res = await db.execute(sql`
    SELECT count(*)::int AS c FROM ait_boost_campaigns
    WHERE user_id = ${userId}
      AND (created_at AT TIME ZONE 'UTC')::date = ${today}::date
  `);
  const count = Number((res as unknown as { rows?: { c: number }[] }).rows?.[0]?.c ?? 0);
  if (count >= AIT_BOOST_MAX_PER_DAY) {
    return { ok: false, message: `Лимит ${AIT_BOOST_MAX_PER_DAY} буста в день` };
  }
  return { ok: true };
}

export async function launchBoostCampaign(
  userId: string,
  postId: string,
): Promise<{ ok: boolean; message?: string; cost?: number }> {
  const post = await storage.getTravelPost(postId);
  if (!post) return { ok: false, message: "Пост не найден" };
  if (post.userId !== userId) return { ok: false, message: "Можно бустить только свои посты" };

  const qsBreakdown = await computeQualityScore(postId, userId);
  if (!isBoostAllowed(qsBreakdown.score)) {
    return { ok: false, message: "Quality Score слишком низкий для буста" };
  }

  const proof = await checkProofOfExperience(userId, post.location?.split(",").pop()?.trim());
  const cost = computeBoostCost(AIT_BOOST_BASE_COST, qsBreakdown.score, proof.discountMultiplier);

  const spent = await store.applyBalanceDelta(
    userId,
    "spend",
    -cost,
    "spend_shop",
    "Boost поста 24ч",
    "post",
    postId,
    { skipEmissionCap: true },
  );
  if (!spent) return { ok: false, message: "Недостаточно AIT" };

  const burnAmt = calculateBurnAmount(cost, AIT_BURN_RATES.boost);
  if (burnAmt > 0) {
    await recordBurn({
      amount: burnAmt,
      source: "boost",
      userId,
      entityType: "post",
      entityId: postId,
    });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const id = genCampaignId();
  const db = getDb();

  if (!db) {
    memCampaigns.push({
      id,
      postId,
      userId,
      budgetAit: cost,
      spentAit: cost,
      qsAtLaunch: qsBreakdown.score,
      verifiedExperience: proof.verified,
      expiresAt,
    });
  } else {
    await db.execute(sql`
      INSERT INTO ait_boost_campaigns (
        id, post_id, user_id, budget_ait, spent_ait, qs_at_launch,
        verified_experience, expires_at, status
      ) VALUES (
        ${id}, ${postId}, ${userId}, ${cost}, ${cost}, ${qsBreakdown.score},
        ${proof.verified}, ${expiresAt.toISOString()}::timestamptz, 'active'
      )
    `);
  }

  await addPostBoost(postId, userId, 24);
  return { ok: true, cost };
}

export type BoostCampaignMeta = {
  campaignId: string;
  qsAtLaunch: number;
  verifiedExperience: boolean;
  promoteLabel: string;
};

export async function getActiveBoostCampaigns(): Promise<Map<string, BoostCampaignMeta>> {
  const db = getDb();
  const now = new Date();
  const out = new Map<string, BoostCampaignMeta>();

  if (!db) {
    for (const c of memCampaigns) {
      if (c.expiresAt > now) {
        out.set(c.postId, {
          campaignId: c.id,
          qsAtLaunch: c.qsAtLaunch,
          verifiedExperience: c.verifiedExperience,
          promoteLabel: c.verifiedExperience
            ? "Promoted · Verified experience"
            : "Promoted · Unverified",
        });
      }
    }
    return out;
  }

  const res = await db.execute(sql`
    SELECT id, post_id, qs_at_launch, verified_experience
    FROM ait_boost_campaigns
    WHERE status = 'active' AND expires_at > now()
  `);
  for (const r of (res as unknown as { rows?: Record<string, unknown>[] }).rows ?? []) {
    const verified = Boolean(r.verified_experience);
    out.set(String(r.post_id), {
      campaignId: String(r.id),
      qsAtLaunch: Number(r.qs_at_launch),
      verifiedExperience: verified,
      promoteLabel: verified ? "Promoted · Verified experience" : "Promoted · Unverified",
    });
  }
  return out;
}

export async function incrementBoostImpression(postId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    UPDATE ait_boost_campaigns SET impressions = impressions + 1
    WHERE post_id = ${postId} AND status = 'active' AND expires_at > now()
  `);
}

export async function incrementBoostClick(postId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    UPDATE ait_boost_campaigns SET clicks = clicks + 1
    WHERE post_id = ${postId} AND status = 'active' AND expires_at > now()
  `);
}
