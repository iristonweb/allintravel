import type { AitGrantResult } from "./service";
import { tryGrantSpend } from "./service";
import * as store from "./store";

export async function tryClaimRingsWeeklyBonus(userId: string): Promise<AitGrantResult | null> {
  const rings = await store.getRingProgress(userId);
  const allFull = Object.values(rings).every((r) => r.percent >= 100);
  if (!allFull) return null;
  if (await store.isRingsBonusClaimedToday(userId)) return null;
  const marked = await store.markRingsBonusClaimedToday(userId);
  if (!marked) return null;
  return tryGrantSpend(userId, "rings_weekly", {
    skipCap: true,
    entityType: "rings",
    entityId: store.todayUtc(),
  });
}
