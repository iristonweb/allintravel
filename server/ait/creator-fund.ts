import { sql } from "drizzle-orm";
import {
  CREATOR_FUND_MIN_LIFETIME,
  CREATOR_FUND_MONTHLY_POOL,
  resolveCreatorRank,
} from "@shared/ait";
import { getDb } from "../db";
import * as store from "./store";
import { tryGrantCreator } from "./service";

const memCycles = new Map<string, { distributed: boolean; poolTotal: number }>();
const memPayouts = new Map<string, { userId: string; amount: number }[]>();

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function ensureCreatorFundSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_fund_cycles (
      month_key varchar(7) PRIMARY KEY,
      pool_total integer NOT NULL,
      distributed_at timestamp,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_fund_payouts (
      id varchar PRIMARY KEY,
      month_key varchar(7) NOT NULL,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount integer NOT NULL,
      score integer NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS ait_fund_payout_user_month
    ON ait_fund_payouts (month_key, user_id)
  `);
}

export type CreatorMonthScore = { userId: string; earned: number };

export async function getCreatorEarningsForMonth(monthKey: string): Promise<CreatorMonthScore[]> {
  const db = getDb();
  if (!db) {
    const raw = store.aggregateCreatorEarningsMem(monthKey);
    const filtered: CreatorMonthScore[] = [];
    for (const r of raw) {
      const bal = await store.getOrCreateBalance(r.userId);
      if (bal.lifetimeCreatorEarned >= CREATOR_FUND_MIN_LIFETIME) {
        filtered.push(r);
      }
    }
    return filtered;
  }

  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const res = await db.execute(sql`
    SELECT user_id, COALESCE(SUM(delta), 0)::int AS earned
    FROM ait_transactions
    WHERE wallet = 'creator' AND delta > 0
      AND reason_code NOT IN ('creator_fund_payout', 'admin_adjust')
      AND created_at >= ${start.toISOString()}::timestamptz
      AND created_at < ${end.toISOString()}::timestamptz
    GROUP BY user_id
    HAVING SUM(delta) >= 10
  `);
  const rows = (res as unknown as { rows?: { user_id: string; earned: number }[] }).rows ?? [];
  const filtered: CreatorMonthScore[] = [];
  for (const r of rows) {
    const bal = await store.getOrCreateBalance(r.user_id);
    if (bal.lifetimeCreatorEarned >= CREATOR_FUND_MIN_LIFETIME) {
      filtered.push({ userId: r.user_id, earned: Number(r.earned) });
    }
  }
  return filtered;
}

async function isMonthDistributed(monthKey: string): Promise<boolean> {
  const db = getDb();
  if (!db) {
    return memCycles.get(monthKey)?.distributed ?? false;
  }
  const res = await db.execute(sql`
    SELECT distributed_at FROM ait_fund_cycles WHERE month_key = ${monthKey}
  `);
  const row = (res as unknown as { rows?: { distributed_at: string | null }[] }).rows?.[0];
  return Boolean(row?.distributed_at);
}

export async function distributeCreatorFund(monthKey: string): Promise<{
  distributed: boolean;
  totalPaid: number;
  recipients: number;
}> {
  await ensureCreatorFundSchema();
  if (await isMonthDistributed(monthKey)) {
    return { distributed: false, totalPaid: 0, recipients: 0 };
  }

  const scores = await getCreatorEarningsForMonth(monthKey);
  const totalEarned = scores.reduce((s, x) => s + x.earned, 0);
  if (totalEarned < 1 || scores.length === 0) {
    await markCycleDistributed(monthKey, 0);
    return { distributed: true, totalPaid: 0, recipients: 0 };
  }

  const pool = CREATOR_FUND_MONTHLY_POOL;
  let paid = 0;
  const payouts: { userId: string; amount: number; score: number }[] = [];

  for (const s of scores) {
    const share = Math.floor((pool * s.earned) / totalEarned);
    if (share < 1) continue;
    payouts.push({ userId: s.userId, amount: share, score: s.earned });
    paid += share;
  }

  for (const p of payouts) {
    await tryGrantCreator(p.userId, "creator_fund_payout", {
      amountOverride: p.amount,
      skipCap: true,
      entityType: "fund",
      entityId: monthKey,
    });
    await recordPayout(monthKey, p.userId, p.amount, p.score);
  }

  await markCycleDistributed(monthKey, paid);
  return { distributed: true, totalPaid: paid, recipients: payouts.length };
}

async function markCycleDistributed(monthKey: string, totalPaid: number): Promise<void> {
  const db = getDb();
  if (!db) {
    memCycles.set(monthKey, { distributed: true, poolTotal: CREATOR_FUND_MONTHLY_POOL });
    return;
  }
  await db.execute(sql`
    INSERT INTO ait_fund_cycles (month_key, pool_total, distributed_at)
    VALUES (${monthKey}, ${CREATOR_FUND_MONTHLY_POOL}, now())
    ON CONFLICT (month_key) DO UPDATE SET distributed_at = COALESCE(ait_fund_cycles.distributed_at, now())
  `);
  void totalPaid;
}

async function recordPayout(
  monthKey: string,
  userId: string,
  amount: number,
  score: number,
): Promise<void> {
  const id = `fund-${monthKey}-${userId}`;
  const db = getDb();
  if (!db) {
    const list = memPayouts.get(monthKey) ?? [];
    list.push({ userId, amount });
    memPayouts.set(monthKey, list);
    return;
  }
  await db.execute(sql`
    INSERT INTO ait_fund_payouts (id, month_key, user_id, amount, score)
    VALUES (${id}, ${monthKey}, ${userId}, ${amount}, ${score})
    ON CONFLICT (month_key, user_id) DO NOTHING
  `);
}

export async function getCreatorFundStatus(userId: string) {
  await ensureCreatorFundSchema();
  const prev = previousMonthKey();
  const cur = currentMonthKey();

  if (!(await isMonthDistributed(prev))) {
    await distributeCreatorFund(prev);
  }

  const monthScores = await getCreatorEarningsForMonth(cur);
  const myScore = monthScores.find((s) => s.userId === userId)?.earned ?? 0;
  const totalMonth = monthScores.reduce((s, x) => s + x.earned, 0);
  const estimatedShare =
    totalMonth > 0 && myScore > 0
      ? Math.floor((CREATOR_FUND_MONTHLY_POOL * myScore) / totalMonth)
      : 0;

  const balance = await store.getOrCreateBalance(userId);
  const rank = resolveCreatorRank(balance.lifetimeCreatorEarned);

  const lastPayout = await getUserPayout(userId, prev);
  const distributed = await isMonthDistributed(prev);

  let aitGrant: {
    granted: boolean;
    amount: number;
    wallet: "creator";
    title: string;
    reason: "creator_fund_payout";
  } | null = null;

  if (lastPayout > 0 && distributed && !(await store.isFundPayoutSeen(userId, prev))) {
    await store.markFundPayoutSeen(userId, prev);
    aitGrant = {
      granted: true,
      amount: lastPayout,
      wallet: "creator",
      title: "Creator Fund",
      reason: "creator_fund_payout",
    };
  }

  return {
    monthKey: cur,
    poolTotal: CREATOR_FUND_MONTHLY_POOL,
    yourMonthCreatorEarned: myScore,
    estimatedShare,
    eligible: balance.lifetimeCreatorEarned >= CREATOR_FUND_MIN_LIFETIME,
    creatorRank: rank,
    participants: monthScores.length,
    lastMonth: {
      monthKey: prev,
      yourPayout: lastPayout,
      distributed,
    },
    aitGrant,
  };
}

async function getUserPayout(userId: string, monthKey: string): Promise<number> {
  const db = getDb();
  if (!db) {
    const list = memPayouts.get(monthKey) ?? [];
    return list.find((p) => p.userId === userId)?.amount ?? 0;
  }
  const res = await db.execute(sql`
    SELECT amount FROM ait_fund_payouts WHERE user_id = ${userId} AND month_key = ${monthKey}
  `);
  return Number((res as unknown as { rows?: { amount: number }[] }).rows?.[0]?.amount ?? 0);
}
