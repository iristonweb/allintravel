import type { AitGrantResult } from "./service";
import { sendPushToUser } from "../push";

const MIN_PUSH_AMOUNT = 10;
const SKIP_REASONS = new Set(["daily_login", "presence_pulse"]);

export async function maybePushAitGrant(
  userId: string,
  grant: AitGrantResult | null | undefined,
): Promise<void> {
  if (!grant?.granted || grant.amount === 0) return;
  if (SKIP_REASONS.has(grant.reason)) return;
  const abs = Math.abs(grant.amount);
  if (abs < MIN_PUSH_AMOUNT && grant.reason !== "creator_fund_payout") return;

  const sign = grant.amount > 0 ? "+" : "";
  const wallet = grant.wallet === "creator" ? "Creator " : "";
  await sendPushToUser(userId, {
    title: `${sign}${grant.amount} ${wallet}AIT`,
    body: grant.title,
    url: "/wallet",
    tag: `ait-${grant.reason}-${Date.now()}`,
    soundKind: "ait",
  });
}
