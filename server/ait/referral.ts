import { sql } from "drizzle-orm";
import { AIT_REFERRAL_REWARD } from "@shared/ait";
import { getDb } from "../db";
import type { AitGrantResult } from "./service";
import { tryGrantSpend } from "./service";
import * as store from "./store";

const memCodes = new Map<string, string>();
const memCodeToUser = new Map<string, string>();
const memReferrals = new Map<string, string>();

function codeFromUserId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 10).toUpperCase();
}

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

export async function applyReferralCode(
  referredUserId: string,
  code: string,
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  await ensureReferralSchema();
  const referrerId = await resolveReferrerId(code);
  if (!referrerId) return { ok: false, message: "Код не найден" };
  if (referrerId === referredUserId) return { ok: false, message: "Нельзя использовать свой код" };

  const db = getDb();
  if (!db) {
    if (memReferrals.has(referredUserId)) {
      return { ok: false, message: "Реферал уже применён" };
    }
    memReferrals.set(referredUserId, referrerId);
  } else {
    try {
      await db.execute(sql`
        INSERT INTO ait_referrals (referred_id, referrer_id) VALUES (${referredUserId}, ${referrerId})
      `);
    } catch {
      return { ok: false, message: "Реферал уже применён" };
    }
  }

  const joined = await tryGrantSpend(referredUserId, "referral_joined", {
    skipCap: true,
    entityType: "referral",
    entityId: referrerId,
  });
  await tryGrantSpend(referrerId, "referral_inviter", {
    skipCap: true,
    entityType: "referral",
    entityId: referredUserId,
  });

  if (db) {
    await db.execute(sql`
      UPDATE ait_referrals SET rewarded = true WHERE referred_id = ${referredUserId}
    `);
  }

  return {
    ok: true,
    grant: joined ?? {
      granted: true,
      amount: AIT_REFERRAL_REWARD,
      wallet: "spend",
      title: "Реферальный бонус",
      reason: "referral_joined",
    },
  };
}

export async function getReferralInfo(userId: string): Promise<{ code: string; invited: number }> {
  await ensureReferralSchema();
  const code = await getOrCreateReferralCode(userId);
  const db = getDb();
  if (!db) {
    let invited = 0;
    for (const [, ref] of Array.from(memReferrals.entries())) {
      if (ref === userId) invited++;
    }
    return { code, invited };
  }
  const res = await db.execute(sql`
    SELECT count(*)::int AS c FROM ait_referrals WHERE referrer_id = ${userId}
  `);
  const invited = Number((res as unknown as { rows?: { c: number }[] }).rows?.[0]?.c ?? 0);
  return { code, invited };
}
