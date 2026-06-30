import type { AitReasonCode } from "@shared/ait";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export type FraudCheckResult = { allowed: boolean; reason?: string; penaltyMultiplier?: number };

const memActionLog = new Map<string, number[]>();
const memFraudFlags = new Map<string, { level: number; expiresAt: Date | null }>();

const RAPID_ACTION_LIMIT = 100;
const RAPID_ACTION_WINDOW_MS = 60_000;

function bucketMinute(): string {
  const d = new Date();
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

async function recordAndCountAction(
  userId: string,
  reason: AitReasonCode,
): Promise<number> {
  const db = getDb();
  const bucket = bucketMinute();

  if (db) {
    const res = await db.execute(sql`
      INSERT INTO ait_fraud_rate (user_id, reason_code, bucket_minute, action_count)
      VALUES (${userId}, ${reason}, ${bucket}::timestamptz, 1)
      ON CONFLICT (user_id, reason_code, bucket_minute)
      DO UPDATE SET action_count = ait_fraud_rate.action_count + 1
      RETURNING action_count
    `);
    const minuteCount = Number(
      (res as unknown as { rows?: { action_count: number }[] }).rows?.[0]?.action_count ?? 1,
    );
    const windowRes = await db.execute(sql`
      SELECT coalesce(sum(action_count), 0)::int AS total
      FROM ait_fraud_rate
      WHERE user_id = ${userId}
        AND reason_code = ${reason}
        AND bucket_minute > now() - interval '1 minute'
    `);
    return Number((windowRes as unknown as { rows?: { total: number }[] }).rows?.[0]?.total ?? minuteCount);
  }

  const key = `${userId}:${reason}`;
  const now = Date.now();
  const window = memActionLog.get(key) ?? [];
  const recent = window.filter((t) => now - t < RAPID_ACTION_WINDOW_MS);
  recent.push(now);
  memActionLog.set(key, recent);
  return recent.length;
}

export async function checkFraudBeforeGrant(
  userId: string,
  reason: AitReasonCode,
): Promise<FraudCheckResult> {
  const db = getDb();
  let penaltyMultiplier = 1;

  if (db) {
    const flagRes = await db.execute(sql`
      SELECT level, expires_at FROM ait_fraud_flags
      WHERE user_id = ${userId}
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1
    `);
    const flag = (flagRes as unknown as { rows?: { level: number; expires_at: string | null }[] })
      .rows?.[0];
    if (flag) {
      if (flag.level >= 3) return { allowed: false, reason: "account_suspended" };
      if (flag.level === 2) return { allowed: false, reason: "account_frozen" };
      if (flag.level === 1) penaltyMultiplier = 0.9;
    }
  } else {
    const flag = memFraudFlags.get(userId);
    if (flag && (!flag.expiresAt || flag.expiresAt > new Date())) {
      if (flag.level >= 3) return { allowed: false, reason: "account_suspended" };
      if (flag.level === 2) return { allowed: false, reason: "account_frozen" };
      if (flag.level === 1) penaltyMultiplier = 0.9;
    }
  }

  const recentCount = await recordAndCountAction(userId, reason);

  if (recentCount > RAPID_ACTION_LIMIT) {
    if (db) {
      await db.execute(sql`
        INSERT INTO ait_fraud_flags (user_id, level, reason, expires_at)
        VALUES (${userId}, 1, ${`rapid_${reason}`}, now() + interval '7 days')
        ON CONFLICT (user_id) DO UPDATE SET
          level = GREATEST(ait_fraud_flags.level, 1),
          reason = ${`rapid_${reason}`},
          expires_at = now() + interval '7 days'
      `);
    } else {
      memFraudFlags.set(userId, {
        level: 1,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });
    }
    return { allowed: false, reason: "rapid_actions" };
  }

  return { allowed: true, penaltyMultiplier };
}

export async function ensureFraudSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_fraud_rate (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason_code varchar(40) NOT NULL,
      bucket_minute timestamptz NOT NULL,
      action_count integer NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, reason_code, bucket_minute)
    )
  `);
}
