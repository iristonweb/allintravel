import { sql } from "drizzle-orm";
import { AIT_REFERRAL_REWARD } from "@shared/ait";
import { getDb } from "../db";
import { storage } from "../storage";
import type { AitGrantResult } from "./service";

const memCodes = new Map<string, string>();
const memCodeToUser = new Map<string, string>();
const memReferrals = new Map<string, { referrerId: string; rewarded: boolean; createdAt: Date }>();

function codeFromUserId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 10).toUpperCase();
}

export type ReferralInvitee = {
  userId: string;
  displayName: string;
  username: string | null;
  profileImageUrl: string | null;
  rewarded: boolean;
  createdAt: string;
};

export type ReferralInfo = {
  code: string;
  invited: number;
  rewardedCount: number;
  totalEarned: number;
  hasUsedCode: boolean;
  myReferrerCode: string | null;
  invitees: ReferralInvitee[];
};

export async function ensureReferralSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_referral_codes (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code varchar(12) NOT NULL UNIQUE,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_referrals (
      referred_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rewarded boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now()
    )
  `);
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  await ensureReferralSchema();
  const db = getDb();
  if (!db) {
    let code = memCodes.get(userId);
    if (!code) {
      code = codeFromUserId(userId);
      memCodes.set(userId, code);
      memCodeToUser.set(code, userId);
    }
    return code;
  }
  const existing = await db.execute(sql`
    SELECT code FROM ait_referral_codes WHERE user_id = ${userId}
  `);
  const row = (existing as unknown as { rows?: { code: string }[] }).rows?.[0];
  if (row?.code) return row.code;

  let code = codeFromUserId(userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.execute(sql`
        INSERT INTO ait_referral_codes (user_id, code) VALUES (${userId}, ${code})
      `);
      return code;
    } catch {
      code = `${codeFromUserId(userId)}${attempt}`;
    }
  }
  return codeFromUserId(userId);
}

async function resolveReferrerId(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  const db = getDb();
  if (!db) {
    return memCodeToUser.get(normalized) ?? null;
  }
  const res = await db.execute(sql`
    SELECT user_id FROM ait_referral_codes WHERE upper(code) = ${normalized}
  `);
  return (res as unknown as { rows?: { user_id: string }[] }).rows?.[0]?.user_id ?? null;
}

export async function getReferrerIdForUser(referredUserId: string): Promise<string | null> {
  await ensureReferralSchema();
  const db = getDb();
  if (!db) {
    return memReferrals.get(referredUserId)?.referrerId ?? null;
  }
  const res = await db.execute(sql`
    SELECT referrer_id FROM ait_referrals WHERE referred_id = ${referredUserId}
  `);
  return (res as unknown as { rows?: { referrer_id: string }[] }).rows?.[0]?.referrer_id ?? null;
}

async function markReferralRewarded(referredUserId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const row = memReferrals.get(referredUserId);
    if (row) row.rewarded = true;
    return;
  }
  await db.execute(sql`
    UPDATE ait_referrals SET rewarded = true WHERE referred_id = ${referredUserId}
  `);
}

async function insertReferralLink(referredUserId: string, referrerId: string): Promise<boolean> {
  const db = getDb();
  if (!db) {
    if (memReferrals.has(referredUserId)) return false;
    memReferrals.set(referredUserId, {
      referrerId,
      rewarded: false,
      createdAt: new Date(),
    });
    return true;
  }
  try {
    await db.execute(sql`
      INSERT INTO ait_referrals (referred_id, referrer_id) VALUES (${referredUserId}, ${referrerId})
    `);
    return true;
  } catch {
    return false;
  }
}

async function completeReferralRewards(
  referredUserId: string,
  _referrerId: string,
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  const { rewardReferralMilestone } = await import("./referral-milestones");
  await rewardReferralMilestone(referredUserId, "signup");

  const grant: AitGrantResult = {
    granted: true,
    amount: AIT_REFERRAL_REWARD,
    wallet: "spend",
    title: "Реферальный бонус",
    reason: "referral_joined",
  };

  await markReferralRewarded(referredUserId);
  return { ok: true, grant };
}

export async function applyReferralCode(
  referredUserId: string,
  code: string,
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  await ensureReferralSchema();
  const referrerId = await resolveReferrerId(code);
  if (!referrerId) return { ok: false, message: "Код не найден" };
  if (referrerId === referredUserId) return { ok: false, message: "Нельзя использовать свой код" };

  const existingReferrer = await getReferrerIdForUser(referredUserId);
  if (existingReferrer) {
    if (existingReferrer !== referrerId) {
      return { ok: false, message: "Реферал уже применён" };
    }
    return completeReferralRewards(referredUserId, referrerId);
  }

  const inserted = await insertReferralLink(referredUserId, referrerId);
  if (!inserted) return { ok: false, message: "Реферал уже применён" };

  return completeReferralRewards(referredUserId, referrerId);
}

async function listInvitees(referrerId: string): Promise<ReferralInvitee[]> {
  const db = getDb();
  type Row = { referred_id: string; rewarded: boolean; created_at: string };
  let rows: Row[] = [];
  if (!db) {
    for (const [referredId, row] of Array.from(memReferrals.entries())) {
      if (row.referrerId === referrerId) {
        rows.push({
          referred_id: referredId,
          rewarded: row.rewarded,
          created_at: row.createdAt.toISOString(),
        });
      }
    }
  } else {
    const res = await db.execute(sql`
      SELECT referred_id, rewarded, created_at
      FROM ait_referrals
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC
      LIMIT 50
    `);
    rows = ((res as unknown as { rows?: Row[] }).rows ?? []) as Row[];
  }

  const invitees: ReferralInvitee[] = [];
  for (const r of rows) {
    const user = await storage.getUser(r.referred_id);
    invitees.push({
      userId: r.referred_id,
      displayName: user
        ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.email ||
          "Путешественник"
        : "Путешественник",
      username: user?.username ?? null,
      profileImageUrl: user?.profileImageUrl ?? null,
      rewarded: r.rewarded,
      createdAt: new Date(r.created_at).toISOString(),
    });
  }
  return invitees;
}

export async function getReferralInfo(userId: string): Promise<ReferralInfo> {
  await ensureReferralSchema();
  const code = await getOrCreateReferralCode(userId);
  const db = getDb();
  let invited = 0;
  let rewardedCount = 0;
  if (!db) {
    for (const [, row] of Array.from(memReferrals.entries())) {
      if (row.referrerId === userId) {
        invited++;
        if (row.rewarded) rewardedCount++;
      }
    }
  } else {
    const res = await db.execute(sql`
      SELECT
        count(*)::int AS invited,
        count(*) FILTER (WHERE rewarded)::int AS rewarded_count
      FROM ait_referrals
      WHERE referrer_id = ${userId}
    `);
    const row = (res as unknown as { rows?: { invited: number; rewarded_count: number }[] })
      .rows?.[0];
    invited = Number(row?.invited ?? 0);
    rewardedCount = Number(row?.rewarded_count ?? 0);
  }

  const myReferrerId = await getReferrerIdForUser(userId);
  let myReferrerCode: string | null = null;
  if (myReferrerId) {
    myReferrerCode = await getOrCreateReferralCode(myReferrerId);
  }

  const invitees = await listInvitees(userId);
  const totalEarned = db
    ? await (await import("./referral-milestones")).sumReferralMilestoneEarnings(userId)
    : rewardedCount * AIT_REFERRAL_REWARD;

  return {
    code,
    invited,
    rewardedCount,
    totalEarned,
    hasUsedCode: Boolean(myReferrerId),
    myReferrerCode,
    invitees,
  };
}
