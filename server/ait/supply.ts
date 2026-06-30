import { AIT_PLATFORM_LAUNCH_DATE, getDailyEmissionCap } from "@shared/ait";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

const memSupply = new Map<string, { minted: number; cap: number }>();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getPlatformAgeMonths(): number {
  const launch = new Date(AIT_PLATFORM_LAUNCH_DATE);
  const now = new Date();
  return (
    (now.getFullYear() - launch.getFullYear()) * 12 + (now.getMonth() - launch.getMonth())
  );
}

export async function getTodaySupplyState(): Promise<{ minted: number; cap: number }> {
  const date = todayUtc();
  const cap = getDailyEmissionCap(getPlatformAgeMonths());
  const db = getDb();
  if (!db) {
    const row = memSupply.get(date);
    if (!row) {
      const init = { minted: 0, cap };
      memSupply.set(date, init);
      return init;
    }
    row.cap = cap;
    return row;
  }
  const res = await db.execute(sql`
    INSERT INTO ait_supply_daily (cap_date, minted_total, emission_cap)
    VALUES (${date}::date, 0, ${cap})
    ON CONFLICT (cap_date) DO UPDATE SET emission_cap = ${cap}
    RETURNING minted_total, emission_cap
  `);
  const row = (res as unknown as { rows?: { minted_total: number; emission_cap: number }[] })
    .rows?.[0];
  return {
    minted: Number(row?.minted_total ?? 0),
    cap: Number(row?.emission_cap ?? cap),
  };
}

/** Reserve emission budget before granting. Returns false if daily cap exceeded. */
export async function tryReserveEmission(amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  const date = todayUtc();
  const cap = getDailyEmissionCap(getPlatformAgeMonths());
  const db = getDb();
  if (!db) {
    const state = await getTodaySupplyState();
    if (state.minted + amount > state.cap) return false;
    memSupply.set(date, { minted: state.minted + amount, cap });
    return true;
  }
  const res = await db.execute(sql`
    INSERT INTO ait_supply_daily (cap_date, minted_total, emission_cap)
    VALUES (${date}::date, ${amount}, ${cap})
    ON CONFLICT (cap_date) DO UPDATE SET
      minted_total = ait_supply_daily.minted_total + ${amount},
      emission_cap = ${cap},
      updated_at = now()
    WHERE ait_supply_daily.minted_total + ${amount} <= ${cap}
    RETURNING minted_total
  `);
  return ((res as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;
}
