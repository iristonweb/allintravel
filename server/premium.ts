import {
  FOUNDER_PREMIUM_SKUS,
  PREMIUM_LIFETIME_UNTIL,
  isFounderEmail,
  isPremiumActive,
} from "./admin";
import { getPremiumPlan, type PremiumPlanId } from "@shared/premium";
import type { IStorage } from "./storage";
import type { User } from "@shared/schema";

async function grantPremiumPerks(userId: string): Promise<void> {
  try {
    const { getEntitlements, addEntitlement } = await import("./ait/store");
    const existing = await getEntitlements(userId);
    const have = new Set(existing.map((e) => e.sku));
    for (const sku of FOUNDER_PREMIUM_SKUS) {
      if (have.has(sku)) continue;
      await addEntitlement(userId, sku, null, null);
    }
  } catch (err) {
    console.warn("[premium] entitlement grant skipped:", err);
  }
}

function resolvePremiumUntil(planId: PremiumPlanId, current: Date | null | undefined): Date {
  const plan = getPremiumPlan(planId)!;
  if (plan.durationDays == null) return PREMIUM_LIFETIME_UNTIL;
  const base =
    current && isPremiumActive(current) && new Date(current).getTime() > Date.now()
      ? new Date(current)
      : new Date();
  return new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
}

/** Grant lifetime Premium + founder AIT perk entitlements (idempotent). */
export async function grantPlatformPremium(storage: IStorage, user: User): Promise<User> {
  let next = user;
  if (!isPremiumActive(user.premiumUntil)) {
    next = await storage.setUserPremium(user.id, PREMIUM_LIFETIME_UNTIL);
  }
  await grantPremiumPerks(user.id);
  return next;
}

/** Purchase Premium with AIT (dual-wallet debit). */
export async function purchasePremiumWithAit(
  storage: IStorage,
  user: User,
  planId: PremiumPlanId,
): Promise<{ ok: boolean; message?: string; user?: User }> {
  const plan = getPremiumPlan(planId);
  if (!plan) return { ok: false, message: "Unknown plan" };

  if (planId === "lifetime" && isPremiumActive(user.premiumUntil)) {
    const until = user.premiumUntil ? new Date(user.premiumUntil) : null;
    if (until && until.getFullYear() >= 9999) {
      return { ok: false, message: "Lifetime Premium already active" };
    }
  }

  const { debitDualWallet } = await import("./ait/store");
  const spent = await debitDualWallet(
    user.id,
    plan.costAit,
    "spend_shop",
    `Premium: ${plan.titleDefault}`,
    "premium",
    plan.id,
  );
  if (!spent) return { ok: false, message: "Недостаточно AIT" };

  const until = resolvePremiumUntil(planId, user.premiumUntil);
  const next = await storage.setUserPremium(user.id, until);
  await grantPremiumPerks(user.id);
  return { ok: true, user: next };
}

/** Promote admin + founder premium when email is on allowlist. */
export async function ensureAdminAndPremium(storage: IStorage, user: User): Promise<User> {
  const { resolveIsAdmin } = await import("./admin");
  let next = user;
  if (resolveIsAdmin(user.email) && !user.isAdmin) {
    next = await storage.setUserAdmin(user.id, true);
  }
  if (isFounderEmail(next.email) || resolveIsAdmin(next.email)) {
    next = await grantPlatformPremium(storage, next);
  }
  return next;
}

export function withPremiumFlags<T extends User>(user: T): T & { isPremium: boolean } {
  return {
    ...user,
    isPremium: isPremiumActive(user.premiumUntil),
  };
}
