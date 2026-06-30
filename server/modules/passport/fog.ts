import { sql } from "drizzle-orm";
import { WORLD_COUNTRY_COUNT } from "@shared/ait";
import { getDb } from "../../db";
import type { IStorage } from "../../storage";
import { getPassportForUser } from "./service";
import { weekKey } from "../../ait/store";
import { tryGrantSpend } from "../../ait/service";

const memFogShares = new Set<string>();

export type FogMapPayload = {
  exploredCountries: string[];
  exploredCount: number;
  totalCountries: number;
  exploredPercent: number;
  fogLevel: number;
};

export async function getFogMapForUser(storage: IStorage, userId: string): Promise<FogMapPayload> {
  const passport = await getPassportForUser(storage, userId);
  const exploredCountries = Array.from(new Set(passport.stamps.map((s) => s.countryName)));
  const exploredCount = exploredCountries.length;
  const totalCountries = WORLD_COUNTRY_COUNT;
  const exploredPercent = Math.round((exploredCount / totalCountries) * 1000) / 10;
  const fogLevel = Math.max(0, 100 - exploredPercent);

  return {
    exploredCountries,
    exploredCount,
    totalCountries,
    exploredPercent,
    fogLevel,
  };
}

export async function recordFogShare(
  userId: string,
): Promise<{ granted: boolean; amount: number }> {
  const wk = weekKey();
  const db = getDb();
  if (db) {
    try {
      await db.execute(sql`
        INSERT INTO ait_fog_shares (user_id, week_key) VALUES (${userId}, ${wk})
      `);
    } catch {
      return { granted: false, amount: 0 };
    }
  } else {
    const key = `${userId}:${wk}`;
    if (memFogShares.has(key)) return { granted: false, amount: 0 };
    memFogShares.add(key);
  }

  const grant = await tryGrantSpend(userId, "fog_share", {
    entityType: "fog_share",
    entityId: wk,
  });

  return {
    granted: Boolean(grant?.granted),
    amount: grant?.amount ?? 0,
  };
}
