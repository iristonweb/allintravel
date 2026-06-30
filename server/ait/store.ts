import { sql } from "drizzle-orm";
import type { AitReasonCode, AitWallet, ActivityRingId } from "@shared/ait";
import { RING_DAILY_TARGET } from "@shared/ait";
import { getDb } from "../db";

export type AitBalanceRow = {
  userId: string;
  spendBalance: number;
  creatorBalance: number;
  lifetimeSpendEarned: number;
  lifetimeCreatorEarned: number;
  streakDays: number;
  lastActiveDate: string | null;
  profileBonusClaimed: boolean;
};

export type AitTransactionRow = {
  id: string;
  userId: string;
  wallet: AitWallet;
  delta: number;
  reasonCode: AitReasonCode;
  title: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
};

type MemBalance = AitBalanceRow;
const memBalances = new Map<string, MemBalance>();
const memTx: AitTransactionRow[] = [];
const memCaps = new Map<string, number>();
const memEntitlements = new Map<
  string,
  { userId: string; sku: string; expiresAt: Date | null }[]
>();
const memRingCounts = new Map<string, Record<ActivityRingId, number>>();
const memQuestClaims = new Set<string>();
const memRingsBonusClaimed = new Set<string>();
const memFundPayoutSeen = new Set<string>();

function capKey(userId: string, reason: string, date: string) {
  return `${userId}:${reason}:${date}`;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(): string {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

/** Monday 00:00 UTC for the current calendar week */
function weekStartMondayUtc(): Date {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}

/** Distinct login days this week (for weekly quest «Пульс») */
export async function getWeeklyLoginDayCount(userId: string): Promise<number> {
  const start = weekStartMondayUtc();
  const db = getDb();
  if (!db) {
    const days = new Set<string>();
    for (const t of memTx) {
      if (
        t.userId === userId &&
        t.reasonCode === "daily_login" &&
        t.delta > 0 &&
        t.createdAt >= start
      ) {
        days.add(t.createdAt.toISOString().slice(0, 10));
      }
    }
    return days.size;
  }
  const res = await db.execute(sql`
    SELECT count(DISTINCT (created_at AT TIME ZONE 'UTC')::date)::int AS c
    FROM ait_transactions
    WHERE user_id = ${userId}
      AND reason_code = 'daily_login'
      AND delta > 0
      AND created_at >= ${start.toISOString()}::timestamptz
  `);
  return Number((res as unknown as { rows?: { c: number }[] }).rows?.[0]?.c ?? 0);
}

function genTxId(): string {
  return `ait-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function ensureAitSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_balances (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      spend_balance integer NOT NULL DEFAULT 0,
      creator_balance integer NOT NULL DEFAULT 0,
      lifetime_spend_earned integer NOT NULL DEFAULT 0,
      lifetime_creator_earned integer NOT NULL DEFAULT 0,
      streak_days integer NOT NULL DEFAULT 0,
      last_active_date date,
      profile_bonus_claimed boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_transactions (
      id varchar PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet varchar(10) NOT NULL,
      delta integer NOT NULL,
      reason_code varchar(40) NOT NULL,
      title varchar(120) NOT NULL,
      entity_type varchar(40),
      entity_id varchar(100),
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ait_tx_user ON ait_transactions (user_id, created_at DESC)
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_daily_caps (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason_code varchar(40) NOT NULL,
      cap_date date NOT NULL,
      count integer NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, reason_code, cap_date)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_entitlements (
      id varchar PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sku varchar(64) NOT NULL,
      expires_at timestamp,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_ring_daily (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ring_date date NOT NULL,
      voice_count integer NOT NULL DEFAULT 0,
      story_count integer NOT NULL DEFAULT 0,
      echo_count integer NOT NULL DEFAULT 0,
      pulse_count integer NOT NULL DEFAULT 0,
      rings_bonus_claimed boolean NOT NULL DEFAULT false,
      PRIMARY KEY (user_id, ring_date)
    )
  `);
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
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_post_boosts (
      post_id varchar PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamp NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_fund_payout_seen (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month_key varchar(7) NOT NULL,
      seen_at timestamp DEFAULT now(),
      PRIMARY KEY (user_id, month_key)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_quest_claims (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quest_id varchar(40) NOT NULL,
      week_key varchar(12) NOT NULL,
      claimed_at timestamp DEFAULT now(),
      PRIMARY KEY (user_id, quest_id, week_key)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_supply_daily (
      cap_date date PRIMARY KEY,
      minted_total integer NOT NULL DEFAULT 0,
      emission_cap integer NOT NULL,
      updated_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_burns (
      id varchar PRIMARY KEY,
      amount integer NOT NULL,
      source varchar(40) NOT NULL,
      user_id varchar REFERENCES users(id) ON DELETE SET NULL,
      entity_type varchar(40),
      entity_id varchar(100),
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_idempotency_keys (
      idempotency_key varchar PRIMARY KEY,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      operation varchar(40) NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_referral_milestones (
      referred_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      milestone varchar(32) NOT NULL,
      referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rewarded_at timestamp DEFAULT now(),
      PRIMARY KEY (referred_id, milestone)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_fraud_flags (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      level integer NOT NULL DEFAULT 1,
      reason varchar(200) NOT NULL,
      expires_at timestamp,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_boost_campaigns (
      id varchar PRIMARY KEY,
      post_id varchar NOT NULL,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      budget_ait integer NOT NULL,
      spent_ait integer NOT NULL DEFAULT 0,
      qs_at_launch integer NOT NULL DEFAULT 60,
      verified_experience boolean NOT NULL DEFAULT false,
      target_scopes jsonb DEFAULT '[]'::jsonb,
      impressions integer NOT NULL DEFAULT 0,
      clicks integer NOT NULL DEFAULT 0,
      status varchar(20) NOT NULL DEFAULT 'active',
      expires_at timestamp NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_streak_freeze_usage (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month_key varchar(7) NOT NULL,
      used_count integer NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, month_key)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ait_fog_shares (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_key varchar(12) NOT NULL,
      shared_at timestamp DEFAULT now(),
      PRIMARY KEY (user_id, week_key)
    )
  `);
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

export async function getOrCreateBalance(userId: string): Promise<AitBalanceRow> {
  const db = getDb();
  if (!db) {
    let row = memBalances.get(userId);
    if (!row) {
      row = {
        userId,
        spendBalance: 0,
        creatorBalance: 0,
        lifetimeSpendEarned: 0,
        lifetimeCreatorEarned: 0,
        streakDays: 0,
        lastActiveDate: null,
        profileBonusClaimed: false,
      };
      memBalances.set(userId, row);
    }
    return { ...row };
  }

  const existing = await db.execute(sql`
    SELECT user_id, spend_balance, creator_balance, lifetime_spend_earned, lifetime_creator_earned,
           streak_days, last_active_date::text, profile_bonus_claimed
    FROM ait_balances WHERE user_id = ${userId}
  `);
  const rows = (existing as { rows?: Record<string, unknown>[] }).rows ?? [];
  if (rows.length > 0) {
    const r = rows[0]!;
    return {
      userId: String(r.user_id),
      spendBalance: Number(r.spend_balance),
      creatorBalance: Number(r.creator_balance),
      lifetimeSpendEarned: Number(r.lifetime_spend_earned),
      lifetimeCreatorEarned: Number(r.lifetime_creator_earned),
      streakDays: Number(r.streak_days),
      lastActiveDate: r.last_active_date ? String(r.last_active_date) : null,
      profileBonusClaimed: Boolean(r.profile_bonus_claimed),
    };
  }

  await db.execute(sql`
    INSERT INTO ait_balances (user_id) VALUES (${userId})
    ON CONFLICT (user_id) DO NOTHING
  `);
  return getOrCreateBalance(userId);
}

async function insertTransactionDb(
  db: NonNullable<ReturnType<typeof getDb>>,
  tx: {
    userId: string;
    wallet: AitWallet;
    delta: number;
    reasonCode: AitReasonCode;
    title: string;
    entityType: string | null;
    entityId: string | null;
  },
): Promise<AitTransactionRow> {
  const id = genTxId();
  await db.execute(sql`
    INSERT INTO ait_transactions (id, user_id, wallet, delta, reason_code, title, entity_type, entity_id)
    VALUES (${id}, ${tx.userId}, ${tx.wallet}, ${tx.delta}, ${tx.reasonCode}, ${tx.title}, ${tx.entityType}, ${tx.entityId})
  `);
  return {
    id,
    userId: tx.userId,
    wallet: tx.wallet,
    delta: tx.delta,
    reasonCode: tx.reasonCode,
    title: tx.title,
    entityType: tx.entityType,
    entityId: tx.entityId,
    createdAt: new Date(),
  };
}

export async function getDailyCapCount(userId: string, reason: AitReasonCode): Promise<number> {
  const date = todayUtc();
  const db = getDb();
  if (!db) return memCaps.get(capKey(userId, reason, date)) ?? 0;
  const res = await db.execute(sql`
    SELECT count FROM ait_daily_caps
    WHERE user_id = ${userId} AND reason_code = ${reason} AND cap_date = ${date}::date
  `);
  const rows = (res as unknown as { rows?: { count: number }[] }).rows ?? [];
  return Number(rows[0]?.count ?? 0);
}

export async function incrementDailyCap(userId: string, reason: AitReasonCode): Promise<number> {
  const date = todayUtc();
  const db = getDb();
  if (!db) {
    const key = capKey(userId, reason, date);
    const next = (memCaps.get(key) ?? 0) + 1;
    memCaps.set(key, next);
    return next;
  }
  await db.execute(sql`
    INSERT INTO ait_daily_caps (user_id, reason_code, cap_date, count)
    VALUES (${userId}, ${reason}, ${date}::date, 1)
    ON CONFLICT (user_id, reason_code, cap_date)
    DO UPDATE SET count = ait_daily_caps.count + 1
  `);
  return getDailyCapCount(userId, reason);
}

/** Public API — routes through ledger (supply, fraud, idempotency). */
export async function applyBalanceDelta(
  userId: string,
  wallet: AitWallet,
  delta: number,
  reason: AitReasonCode,
  title: string,
  entityType: string | null,
  entityId: string | null,
  opts?: import("./ledger").LedgerApplyOpts,
): Promise<{ balance: AitBalanceRow; transaction: AitTransactionRow } | null> {
  const { applyBalanceDeltaLedger } = await import("./ledger");
  return applyBalanceDeltaLedger(userId, wallet, delta, reason, title, entityType, entityId, opts);
}

/** Low-level balance mutation (no ledger guards). */
export async function applyBalanceDeltaRaw(
  userId: string,
  wallet: AitWallet,
  delta: number,
  reason: AitReasonCode,
  title: string,
  entityType: string | null,
  entityId: string | null,
): Promise<{ balance: AitBalanceRow; transaction: AitTransactionRow } | null> {
  if (delta === 0) return null;
  await getOrCreateBalance(userId);
  const db = getDb();

  if (!db) {
    const row = memBalances.get(userId)!;
    if (wallet === "spend") {
      if (delta < 0 && row.spendBalance + delta < 0) return null;
      row.spendBalance += delta;
      if (delta > 0) row.lifetimeSpendEarned += delta;
    } else {
      if (delta < 0 && row.creatorBalance + delta < 0) return null;
      row.creatorBalance += delta;
      if (delta > 0) row.lifetimeCreatorEarned += delta;
    }
    const transaction: AitTransactionRow = {
      id: genTxId(),
      userId,
      wallet,
      delta,
      reasonCode: reason,
      title,
      entityType,
      entityId,
      createdAt: new Date(),
    };
    memTx.unshift(transaction);
    if (memTx.length > 5000) memTx.length = 5000;
    return { balance: { ...row }, transaction };
  }

  if (wallet === "spend" && delta < 0) {
    const check = await db.execute(sql`
      SELECT spend_balance FROM ait_balances WHERE user_id = ${userId}
    `);
    const bal = Number(
      (check as unknown as { rows?: { spend_balance: number }[] }).rows?.[0]?.spend_balance ?? 0,
    );
    if (bal + delta < 0) return null;
  }
  if (wallet === "creator" && delta < 0) {
    const check = await db.execute(sql`
      SELECT creator_balance FROM ait_balances WHERE user_id = ${userId}
    `);
    const bal = Number(
      (check as unknown as { rows?: { creator_balance: number }[] }).rows?.[0]?.creator_balance ??
        0,
    );
    if (bal + delta < 0) return null;
  }

  if (wallet === "spend") {
    await db.execute(sql`
      UPDATE ait_balances SET
        spend_balance = spend_balance + ${delta},
        lifetime_spend_earned = lifetime_spend_earned + ${delta > 0 ? delta : 0},
        updated_at = now()
      WHERE user_id = ${userId}
    `);
  } else {
    await db.execute(sql`
      UPDATE ait_balances SET
        creator_balance = creator_balance + ${delta},
        lifetime_creator_earned = lifetime_creator_earned + ${delta > 0 ? delta : 0},
        updated_at = now()
      WHERE user_id = ${userId}
    `);
  }

  const transaction = await insertTransactionDb(db, {
    userId,
    wallet,
    delta,
    reasonCode: reason,
    title,
    entityType,
    entityId,
  });
  const balance = await getOrCreateBalance(userId);
  return { balance, transaction };
}

export async function touchStreak(
  userId: string,
): Promise<{ streakDays: number; bonusGranted: boolean }> {
  const today = todayUtc();
  const balance = await getOrCreateBalance(userId);
  const db = getDb();
  let streak = balance.streakDays;
  const bonusGranted = false;

  if (balance.lastActiveDate === today) {
    return { streakDays: streak, bonusGranted: false };
  }

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (balance.lastActiveDate === yesterdayStr) streak += 1;
  else streak = 1;

  if (!db) {
    const row = memBalances.get(userId)!;
    row.streakDays = streak;
    row.lastActiveDate = today;
  } else {
    await db.execute(sql`
      UPDATE ait_balances SET streak_days = ${streak}, last_active_date = ${today}::date, updated_at = now()
      WHERE user_id = ${userId}
    `);
  }

  return { streakDays: streak, bonusGranted };
}

export async function markProfileBonusClaimed(userId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const row = memBalances.get(userId);
    if (row) row.profileBonusClaimed = true;
    return;
  }
  await db.execute(sql`
    UPDATE ait_balances SET profile_bonus_claimed = true, updated_at = now() WHERE user_id = ${userId}
  `);
}

export async function isProfileBonusClaimed(userId: string): Promise<boolean> {
  const b = await getOrCreateBalance(userId);
  return b.profileBonusClaimed;
}

export async function incrementRing(
  userId: string,
  ring: ActivityRingId,
): Promise<Record<ActivityRingId, { count: number; percent: number }>> {
  const date = todayUtc();
  const db = getDb();
  if (!db) {
    const key = `${userId}:${date}`;
    const counts = memRingCounts.get(key) ?? { voice: 0, story: 0, echo: 0, pulse: 0 };
    counts[ring] += 1;
    memRingCounts.set(key, counts);
    return formatRings(counts);
  }

  if (ring === "voice") {
    await db.execute(sql`
      INSERT INTO ait_ring_daily (user_id, ring_date, voice_count)
      VALUES (${userId}, ${date}::date, 1)
      ON CONFLICT (user_id, ring_date) DO UPDATE SET voice_count = ait_ring_daily.voice_count + 1
    `);
  } else if (ring === "story") {
    await db.execute(sql`
      INSERT INTO ait_ring_daily (user_id, ring_date, story_count)
      VALUES (${userId}, ${date}::date, 1)
      ON CONFLICT (user_id, ring_date) DO UPDATE SET story_count = ait_ring_daily.story_count + 1
    `);
  } else if (ring === "echo") {
    await db.execute(sql`
      INSERT INTO ait_ring_daily (user_id, ring_date, echo_count)
      VALUES (${userId}, ${date}::date, 1)
      ON CONFLICT (user_id, ring_date) DO UPDATE SET echo_count = ait_ring_daily.echo_count + 1
    `);
  } else {
    await db.execute(sql`
      INSERT INTO ait_ring_daily (user_id, ring_date, pulse_count)
      VALUES (${userId}, ${date}::date, 1)
      ON CONFLICT (user_id, ring_date) DO UPDATE SET pulse_count = ait_ring_daily.pulse_count + 1
    `);
  }
  return getRingProgress(userId);
}

export async function getRingProgress(
  userId: string,
): Promise<Record<ActivityRingId, { count: number; percent: number }>> {
  const date = todayUtc();
  const db = getDb();
  if (!db) {
    const key = `${userId}:${date}`;
    const counts = memRingCounts.get(key) ?? { voice: 0, story: 0, echo: 0, pulse: 0 };
    return formatRings(counts);
  }
  const res = await db.execute(sql`
    SELECT voice_count, story_count, echo_count, pulse_count
    FROM ait_ring_daily WHERE user_id = ${userId} AND ring_date = ${date}::date
  `);
  const row = (res as { rows?: Record<string, number>[] }).rows?.[0];
  const counts = {
    voice: Number(row?.voice_count ?? 0),
    story: Number(row?.story_count ?? 0),
    echo: Number(row?.echo_count ?? 0),
    pulse: Number(row?.pulse_count ?? 0),
  };
  return formatRings(counts);
}

function formatRings(counts: Record<ActivityRingId, number>) {
  const target = RING_DAILY_TARGET;
  const out = {} as Record<ActivityRingId, { count: number; percent: number }>;
  for (const ring of ["voice", "story", "echo", "pulse"] as ActivityRingId[]) {
    const count = counts[ring] ?? 0;
    out[ring] = { count, percent: Math.min(100, Math.round((count / target) * 100)) };
  }
  return out;
}

export async function getGlobalLedger(limit = 40): Promise<AitTransactionRow[]> {
  const db = getDb();
  if (!db) {
    return [...memTx].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
  const res = await db.execute(sql`
    SELECT id, user_id, wallet, delta, reason_code, title, entity_type, entity_id, created_at
    FROM ait_transactions
    ORDER BY created_at DESC LIMIT ${limit}
  `);
  const rows = (res as { rows?: Record<string, unknown>[] }).rows ?? [];
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    wallet: r.wallet as AitWallet,
    delta: Number(r.delta),
    reasonCode: r.reason_code as AitReasonCode,
    title: String(r.title),
    entityType: r.entity_type ? String(r.entity_type) : null,
    entityId: r.entity_id ? String(r.entity_id) : null,
    createdAt: new Date(String(r.created_at)),
  }));
}

export async function getLedger(userId: string, limit = 40): Promise<AitTransactionRow[]> {
  const db = getDb();
  if (!db) {
    return memTx.filter((t) => t.userId === userId).slice(0, limit);
  }
  const res = await db.execute(sql`
    SELECT id, user_id, wallet, delta, reason_code, title, entity_type, entity_id, created_at
    FROM ait_transactions WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit}
  `);
  const rows = (res as { rows?: Record<string, unknown>[] }).rows ?? [];
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    wallet: r.wallet as AitWallet,
    delta: Number(r.delta),
    reasonCode: r.reason_code as AitReasonCode,
    title: String(r.title),
    entityType: r.entity_type ? String(r.entity_type) : null,
    entityId: r.entity_id ? String(r.entity_id) : null,
    createdAt: new Date(String(r.created_at)),
  }));
}

export async function addEntitlement(
  userId: string,
  sku: string,
  expiresAt: Date | null,
): Promise<void> {
  const id = genTxId();
  const db = getDb();
  if (!db) {
    const list = memEntitlements.get(userId) ?? [];
    list.push({ userId, sku, expiresAt });
    memEntitlements.set(userId, list);
    return;
  }
  await db.execute(sql`
    INSERT INTO ait_entitlements (id, user_id, sku, expires_at)
    VALUES (${id}, ${userId}, ${sku}, ${expiresAt})
  `);
}

export async function getEntitlements(
  userId: string,
): Promise<{ sku: string; expiresAt: Date | null }[]> {
  const db = getDb();
  const now = new Date();
  if (!db) {
    return (memEntitlements.get(userId) ?? []).filter((e) => !e.expiresAt || e.expiresAt > now);
  }
  const res = await db.execute(sql`
    SELECT sku, expires_at FROM ait_entitlements
    WHERE user_id = ${userId} AND (expires_at IS NULL OR expires_at > now())
  `);
  const rows =
    (res as unknown as { rows?: { sku: string; expires_at: string | null }[] }).rows ?? [];
  return rows.map((r) => ({
    sku: r.sku,
    expiresAt: r.expires_at ? new Date(r.expires_at) : null,
  }));
}

export async function getQuestProgress(
  userId: string,
): Promise<Record<string, { claimed: boolean; progress: number }>> {
  const wk = weekKey();
  const rings = await getRingProgress(userId);
  const db = getDb();
  const { WEEKLY_QUESTS, RING_DAILY_TARGET } = await import("@shared/ait");

  const claimedSet = new Set<string>();
  if (!db) {
    for (const q of WEEKLY_QUESTS) {
      if (memQuestClaims.has(`${userId}:${q.id}:${wk}`)) claimedSet.add(q.id);
    }
  } else {
    const res = await db.execute(sql`
      SELECT quest_id FROM ait_quest_claims WHERE user_id = ${userId} AND week_key = ${wk}
    `);
    for (const r of (res as unknown as { rows?: { quest_id: string }[] }).rows ?? []) {
      claimedSet.add(r.quest_id);
    }
  }

  const weeklyLogins = await getWeeklyLoginDayCount(userId);
  const out: Record<string, { claimed: boolean; progress: number }> = {};
  for (const q of WEEKLY_QUESTS) {
    let progress = 0;
    if (q.id === "pulse_5") {
      progress = Math.min(q.target, weeklyLogins);
    } else if (q.ring) {
      progress = Math.min(q.target, rings[q.ring]?.count ?? 0);
    }
    out[q.id] = { claimed: claimedSet.has(q.id), progress };
  }
  void RING_DAILY_TARGET;
  return out;
}

export async function claimQuest(userId: string, questId: string): Promise<boolean> {
  const wk = weekKey();
  const db = getDb();
  if (!db) {
    const key = `${userId}:${questId}:${wk}`;
    if (memQuestClaims.has(key)) return false;
    memQuestClaims.add(key);
    return true;
  }
  try {
    await db.execute(sql`
      INSERT INTO ait_quest_claims (user_id, quest_id, week_key) VALUES (${userId}, ${questId}, ${wk})
    `);
    return true;
  } catch {
    return false;
  }
}

export async function hasGrantForEntity(
  userId: string,
  reason: AitReasonCode,
  entityId: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) {
    return memTx.some(
      (t) =>
        t.userId === userId && t.reasonCode === reason && t.entityId === entityId && t.delta > 0,
    );
  }
  const res = await db.execute(sql`
    SELECT 1 FROM ait_transactions
    WHERE user_id = ${userId} AND reason_code = ${reason} AND entity_id = ${entityId} AND delta > 0
    LIMIT 1
  `);
  return ((res as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;
}

export function aggregateCreatorEarningsMem(
  monthKey: string,
): { userId: string; earned: number }[] {
  const [y, m] = monthKey.split("-").map(Number);
  const start = Date.UTC(y, m - 1, 1);
  const end = Date.UTC(y, m, 1);
  const byUser = new Map<string, number>();
  for (const t of memTx) {
    if (t.wallet !== "creator" || t.delta <= 0) continue;
    if (t.reasonCode === "creator_fund_payout") continue;
    const ts = t.createdAt.getTime();
    if (ts < start || ts >= end) continue;
    byUser.set(t.userId, (byUser.get(t.userId) ?? 0) + t.delta);
  }
  return Array.from(byUser.entries())
    .filter(([, earned]) => earned >= 10)
    .map(([userId, earned]) => ({ userId, earned }));
}

export async function isRingsBonusClaimedToday(userId: string): Promise<boolean> {
  const date = todayUtc();
  const db = getDb();
  if (!db) {
    return memRingsBonusClaimed.has(`${userId}:${date}`);
  }
  const res = await db.execute(sql`
    SELECT rings_bonus_claimed FROM ait_ring_daily
    WHERE user_id = ${userId} AND ring_date = ${date}::date
  `);
  return Boolean(
    (res as unknown as { rows?: { rings_bonus_claimed: boolean }[] }).rows?.[0]
      ?.rings_bonus_claimed,
  );
}

export async function markRingsBonusClaimedToday(userId: string): Promise<boolean> {
  const date = todayUtc();
  const db = getDb();
  if (!db) {
    const key = `${userId}:${date}`;
    if (memRingsBonusClaimed.has(key)) return false;
    memRingsBonusClaimed.add(key);
    return true;
  }
  const res = await db.execute(sql`
    INSERT INTO ait_ring_daily (user_id, ring_date, rings_bonus_claimed)
    VALUES (${userId}, ${date}::date, true)
    ON CONFLICT (user_id, ring_date) DO UPDATE
    SET rings_bonus_claimed = true
    WHERE ait_ring_daily.rings_bonus_claimed = false
    RETURNING user_id
  `);
  return ((res as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;
}

export async function markFundPayoutSeen(userId: string, monthKey: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memFundPayoutSeen.add(`${userId}:${monthKey}`);
    return;
  }
  await db.execute(sql`
    INSERT INTO ait_fund_payout_seen (user_id, month_key) VALUES (${userId}, ${monthKey})
    ON CONFLICT DO NOTHING
  `);
}

export async function isFundPayoutSeen(userId: string, monthKey: string): Promise<boolean> {
  const db = getDb();
  if (!db) {
    return memFundPayoutSeen.has(`${userId}:${monthKey}`);
  }
  const res = await db.execute(sql`
    SELECT 1 FROM ait_fund_payout_seen WHERE user_id = ${userId} AND month_key = ${monthKey}
  `);
  return ((res as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;
}

const memStreakFreeze = new Map<string, number>();

export async function getStreakFreezeUsage(userId: string, monthKey: string): Promise<number> {
  const db = getDb();
  if (!db) return memStreakFreeze.get(`${userId}:${monthKey}`) ?? 0;
  const res = await db.execute(sql`
    SELECT used_count FROM ait_streak_freeze_usage
    WHERE user_id = ${userId} AND month_key = ${monthKey}
  `);
  return Number((res as unknown as { rows?: { used_count: number }[] }).rows?.[0]?.used_count ?? 0);
}

export async function incrementStreakFreezeUsage(userId: string, monthKey: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const key = `${userId}:${monthKey}`;
    memStreakFreeze.set(key, (memStreakFreeze.get(key) ?? 0) + 1);
    return;
  }
  await db.execute(sql`
    INSERT INTO ait_streak_freeze_usage (user_id, month_key, used_count)
    VALUES (${userId}, ${monthKey}, 1)
    ON CONFLICT (user_id, month_key) DO UPDATE SET used_count = ait_streak_freeze_usage.used_count + 1
  `);
}

/** Preserve streak by setting last_active_date to today without incrementing. */
export async function applyStreakFreeze(userId: string): Promise<void> {
  const today = todayUtc();
  const db = getDb();
  if (!db) {
    const row = memBalances.get(userId);
    if (row) row.lastActiveDate = today;
    return;
  }
  await db.execute(sql`
    UPDATE ait_balances SET last_active_date = ${today}::date, updated_at = now()
    WHERE user_id = ${userId}
  `);
}

export function getMemTransactions(): AitTransactionRow[] {
  return memTx;
}

export { weekKey, todayUtc };
