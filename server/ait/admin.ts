import { resolveCreatorRank, type AitWallet } from "@shared/ait";
import * as store from "./store";
import type { AitGrantResult } from "./service";
import { maybePushAitGrant } from "./push-notify";

export async function adminGetUserAit(userId: string) {
  const balance = await store.getOrCreateBalance(userId);
  const rank = resolveCreatorRank(balance.lifetimeCreatorEarned);
  const ledger = await store.getLedger(userId, 30);
  const entitlements = await store.getEntitlements(userId);
  return {
    userId,
    spendBalance: balance.spendBalance,
    creatorBalance: balance.creatorBalance,
    lifetimeSpendEarned: balance.lifetimeSpendEarned,
    lifetimeCreatorEarned: balance.lifetimeCreatorEarned,
    streakDays: balance.streakDays,
    creatorRank: rank,
    entitlements,
    ledger: ledger.map((t) => ({
      id: t.id,
      wallet: t.wallet,
      delta: t.delta,
      reason: t.reasonCode,
      title: t.title,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

export async function adminAdjustAit(
  adminUserId: string,
  targetUserId: string,
  wallet: AitWallet,
  delta: number,
  note: string,
  opts?: { sendPush?: boolean },
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  const amount = Math.floor(delta);
  if (amount === 0) return { ok: false, message: "Сумма не может быть 0" };

  const title = note.trim() || "Корректировка администратора";
  const result = await store.applyBalanceDelta(
    targetUserId,
    wallet,
    amount,
    "admin_adjust",
    title,
    "admin",
    adminUserId,
  );
  if (!result) {
    return { ok: false, message: "Недостаточно баланса или ошибка записи" };
  }

  const grant: AitGrantResult = {
    granted: true,
    amount,
    wallet,
    title,
    reason: "admin_adjust",
  };

  if (opts?.sendPush !== false) {
    void maybePushAitGrant(targetUserId, grant);
  }

  return { ok: true, grant };
}

export async function adminRecentTransactions(limit = 40) {
  return store.getGlobalLedger(limit);
}
