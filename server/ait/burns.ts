import { sql } from "drizzle-orm";
import { getDb } from "../db";

export type BurnSource = "boost" | "tip" | "marketplace" | "manual";

export async function recordBurn(opts: {
  amount: number;
  source: BurnSource;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}): Promise<void> {
  if (opts.amount <= 0) return;
  const id = `burn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    INSERT INTO ait_burns (id, amount, source, user_id, entity_type, entity_id)
    VALUES (${id}, ${opts.amount}, ${opts.source}, ${opts.userId ?? null}, ${opts.entityType ?? null}, ${opts.entityId ?? null})
  `);
}

export function calculateBurnAmount(gross: number, rate: number): number {
  return Math.max(0, Math.floor(gross * rate));
}

/** Record marketplace burn from Stripe platform fee (USD cents → nominal AIT at $0.10). */
export async function recordMarketplaceBurnFromFee(opts: {
  priceCents: number;
  platformFeeRate?: number;
  userId?: string;
  tripId: string;
}): Promise<void> {
  const feeRate = opts.platformFeeRate ?? 0.15;
  const platformFeeCents = Math.floor(opts.priceCents * feeRate);
  const nominalAit = Math.floor(platformFeeCents / 10);
  const burnAmt = calculateBurnAmount(nominalAit, 0.05);
  if (burnAmt <= 0) return;
  await recordBurn({
    amount: burnAmt,
    source: "marketplace",
    userId: opts.userId ?? null,
    entityType: "trip",
    entityId: opts.tripId,
  });
}

export async function getTotalBurnedToday(): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const db = getDb();
  if (!db) return 0;
  const res = await db.execute(sql`
    SELECT coalesce(sum(amount), 0)::int AS total
    FROM ait_burns
    WHERE (created_at AT TIME ZONE 'UTC')::date = ${date}::date
  `);
  return Number((res as unknown as { rows?: { total: number }[] }).rows?.[0]?.total ?? 0);
}
