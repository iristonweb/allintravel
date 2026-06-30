import { sql } from "drizzle-orm";
import { AIT_REFERRAL_MILESTONES, type ReferralMilestoneId } from "@shared/ait";
import { getDb } from "../db";
import { tryGrantSpend } from "./service";
import { getReferrerIdForUser } from "./referral";

const memMilestones = new Set<string>();

export async function ensureReferralMilestoneSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_referral_milestones (
      referred_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      milestone varchar(32) NOT NULL,
      referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rewarded_at timestamp DEFAULT now(),
      PRIMARY KEY (referred_id, milestone)
    )
  `);
}

async function isMilestoneRewarded(
  referredId: string,
  milestone: ReferralMilestoneId,
): Promise<boolean> {
  const db = getDb();
  if (!db) return memMilestones.has(`${referredId}:${milestone}`);
  const res = await db.execute(sql`
    SELECT 1 FROM ait_referral_milestones
    WHERE referred_id = ${referredId} AND milestone = ${milestone}
  `);
  return ((res as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;
}

async function markMilestoneRewarded(
  referredId: string,
  referrerId: string,
  milestone: ReferralMilestoneId,
): Promise<boolean> {
  const db = getDb();
  if (!db) {
    const key = `${referredId}:${milestone}`;
    if (memMilestones.has(key)) return false;
    memMilestones.add(key);
    return true;
  }
  try {
    await db.execute(sql`
      INSERT INTO ait_referral_milestones (referred_id, milestone, referrer_id)
      VALUES (${referredId}, ${milestone}, ${referrerId})
    `);
    return true;
  } catch {
    return false;
  }
}

/** Reward referrer when referred user hits a milestone. */
export async function rewardReferralMilestone(
  referredUserId: string,
  milestone: ReferralMilestoneId,
): Promise<void> {
  await ensureReferralMilestoneSchema();
  const referrerId = await getReferrerIdForUser(referredUserId);
  if (!referrerId) return;
  if (await isMilestoneRewarded(referredUserId, milestone)) return;

  const amount = AIT_REFERRAL_MILESTONES[milestone];
  if (!amount || amount <= 0) return;

  const marked = await markMilestoneRewarded(referredUserId, referrerId, milestone);
  if (!marked) return;

  await tryGrantSpend(referrerId, "referral_milestone", {
    amountOverride: amount,
    entityType: "referral_milestone",
    entityId: `${referredUserId}:${milestone}`,
  });

  if (milestone === "signup") {
    await tryGrantSpend(referredUserId, "referral_joined", {
      amountOverride: 50,
      skipCap: true,
      entityType: "referral_milestone",
      entityId: milestone,
    });
  }
  if (milestone === "email_verified") {
    await tryGrantSpend(referredUserId, "referral_joined", {
      amountOverride: 20,
      skipCap: true,
      entityType: "referral_milestone",
      entityId: milestone,
    });
  }
}

/** Reward referrer when referred user hits activity streak milestones. */
export async function checkReferralActivityMilestones(
  referredUserId: string,
  streakDays: number,
): Promise<void> {
  if (streakDays >= 7) await rewardReferralMilestone(referredUserId, "active_7d");
  if (streakDays >= 30) await rewardReferralMilestone(referredUserId, "active_30d");
}

export async function sumReferralMilestoneEarnings(referrerId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const res = await db.execute(sql`
    SELECT coalesce(sum(delta), 0)::int AS total
    FROM ait_transactions
    WHERE user_id = ${referrerId}
      AND reason_code = 'referral_milestone'
      AND delta > 0
  `);
  return Number((res as unknown as { rows?: { total: number }[] }).rows?.[0]?.total ?? 0);
}
