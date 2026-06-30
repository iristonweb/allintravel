import type { AitReasonCode, AitWallet } from "@shared/ait";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { checkFraudBeforeGrant } from "./fraud";
import { getDailyEmissionCap } from "@shared/ait";
import { getPlatformAgeMonths } from "./supply";
import type { AitBalanceRow, AitTransactionRow } from "./store";
import * as store from "./store";

const memIdempotency = new Set<string>();

function genTxId(): string {
  return `ait-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function checkIdempotency(
  userId: string,
  idempotencyKey: string,
  operation: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) {
    if (memIdempotency.has(idempotencyKey)) return false;
    memIdempotency.add(idempotencyKey);
    return true;
  }
  try {
    await db.execute(sql`
      INSERT INTO ait_idempotency_keys (idempotency_key, user_id, operation)
      VALUES (${idempotencyKey}, ${userId}, ${operation})
    `);
    return true;
  } catch {
    return false;
  }
}

export function buildIdempotencyKey(
  userId: string,
  reason: AitReasonCode,
  entityId: string | null | undefined,
): string | null {
  if (!entityId) return null;
  return `${userId}:${reason}:${entityId}`;
}

export type LedgerApplyOpts = {
  idempotencyKey?: string | null;
  skipEmissionCap?: boolean;
  skipFraud?: boolean;
  skipIdempotency?: boolean;
};

function mapBalanceRow(userId: string, r: Record<string, unknown>): AitBalanceRow {
  return {
    userId,
    spendBalance: Number(r.spend_balance),
    creatorBalance: Number(r.creator_balance),
    lifetimeSpendEarned: Number(r.lifetime_spend_earned),
    lifetimeCreatorEarned: Number(r.lifetime_creator_earned),
    streakDays: Number(r.streak_days),
    lastActiveDate: r.last_active_date ? String(r.last_active_date) : null,
    profileBonusClaimed: Boolean(r.profile_bonus_claimed),
  };
}

/** Atomic balance mutation with idempotency, emission cap, and row lock. */
export async function applyBalanceDeltaLedger(
  userId: string,
  wallet: AitWallet,
  delta: number,
  reason: AitReasonCode,
  title: string,
  entityType: string | null,
  entityId: string | null,
  opts?: LedgerApplyOpts,
): Promise<{ balance: AitBalanceRow; transaction: AitTransactionRow } | null> {
  if (delta === 0) return null;

  const db = getDb();
  if (!db) {
    return store.applyBalanceDeltaRaw(userId, wallet, delta, reason, title, entityType, entityId);
  }

  if (!opts?.skipIdempotency) {
    const idemKey =
      opts?.idempotencyKey ?? buildIdempotencyKey(userId, reason, entityId ?? undefined);
    if (idemKey) {
      const fresh = await checkIdempotency(userId, idemKey, reason);
      if (!fresh) return null;
    }
  }

  if (delta > 0 && wallet === "spend" && !opts?.skipFraud) {
    const fraud = await checkFraudBeforeGrant(userId, reason);
    if (!fraud.allowed) return null;
    if (fraud.penaltyMultiplier != null && fraud.penaltyMultiplier < 1) {
      delta = Math.max(1, Math.floor(delta * fraud.penaltyMultiplier));
    }
  }

  const txId = genTxId();
  const date = new Date().toISOString().slice(0, 10);
  const emissionCap = getDailyEmissionCap(getPlatformAgeMonths());

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO ait_balances (user_id) VALUES (${userId})
        ON CONFLICT (user_id) DO NOTHING
      `);

      if (delta > 0 && wallet === "spend" && !opts?.skipEmissionCap) {
        const reserve = await tx.execute(sql`
          INSERT INTO ait_supply_daily (cap_date, minted_total, emission_cap)
          VALUES (${date}::date, ${delta}, ${emissionCap})
          ON CONFLICT (cap_date) DO UPDATE SET
            minted_total = ait_supply_daily.minted_total + ${delta},
            emission_cap = ${emissionCap},
            updated_at = now()
          WHERE ait_supply_daily.minted_total + ${delta} <= ${emissionCap}
          RETURNING minted_total
        `);
        if (((reserve as unknown as { rows?: unknown[] }).rows?.length ?? 0) === 0) {
          throw new Error("EMISSION_CAP");
        }
      }

      const locked = await tx.execute(sql`
        SELECT user_id, spend_balance, creator_balance, lifetime_spend_earned,
               lifetime_creator_earned, streak_days, last_active_date::text, profile_bonus_claimed
        FROM ait_balances WHERE user_id = ${userId}
        FOR UPDATE
      `);
      const row = (locked as unknown as { rows?: Record<string, unknown>[] }).rows?.[0];
      if (!row) throw new Error("NO_BALANCE");

      if (wallet === "spend" && delta < 0) {
        if (Number(row.spend_balance) + delta < 0) throw new Error("INSUFFICIENT");
      }
      if (wallet === "creator" && delta < 0) {
        if (Number(row.creator_balance) + delta < 0) throw new Error("INSUFFICIENT");
      }

      if (wallet === "spend") {
        await tx.execute(sql`
          UPDATE ait_balances SET
            spend_balance = spend_balance + ${delta},
            lifetime_spend_earned = lifetime_spend_earned + ${delta > 0 ? delta : 0},
            updated_at = now()
          WHERE user_id = ${userId}
        `);
      } else {
        await tx.execute(sql`
          UPDATE ait_balances SET
            creator_balance = creator_balance + ${delta},
            lifetime_creator_earned = lifetime_creator_earned + ${delta > 0 ? delta : 0},
            updated_at = now()
          WHERE user_id = ${userId}
        `);
      }

      await tx.execute(sql`
        INSERT INTO ait_transactions (id, user_id, wallet, delta, reason_code, title, entity_type, entity_id)
        VALUES (${txId}, ${userId}, ${wallet}, ${delta}, ${reason}, ${title}, ${entityType}, ${entityId})
      `);

      const updated = await tx.execute(sql`
        SELECT user_id, spend_balance, creator_balance, lifetime_spend_earned,
               lifetime_creator_earned, streak_days, last_active_date::text, profile_bonus_claimed
        FROM ait_balances WHERE user_id = ${userId}
      `);
      const balRow = (updated as unknown as { rows?: Record<string, unknown>[] }).rows?.[0];
      if (!balRow) return null;

      const transaction: AitTransactionRow = {
        id: txId,
        userId,
        wallet,
        delta,
        reasonCode: reason,
        title,
        entityType,
        entityId,
        createdAt: new Date(),
      };

      return { balance: mapBalanceRow(userId, balRow), transaction };
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INSUFFICIENT" || msg === "EMISSION_CAP" || msg === "NO_BALANCE") return null;
    throw err;
  }
}
