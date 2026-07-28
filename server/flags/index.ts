import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { getConfig } from "../config";
import { FLAG_DEFAULTS, FLAG_KEYS, type FlagKey } from "./keys";

const memFlags = new Map<string, boolean>();
let bootstrapped = false;

function resolveDefault(key: string): boolean {
  const cfg = getConfig();
  if (key in cfg.featureFlagOverrides) {
    return cfg.featureFlagOverrides[key]!;
  }
  const envDefault = cfg.envFlagDefaults[key];
  if (typeof envDefault === "boolean") return envDefault;
  if (key in FLAG_DEFAULTS) return FLAG_DEFAULTS[key as FlagKey];
  return false;
}

export async function bootstrapFlags(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  for (const key of FLAG_KEYS) {
    memFlags.set(key, resolveDefault(key));
  }

  const db = getDb();
  if (!db) return;

  try {
    await Promise.race([
      (async () => {
        for (const key of FLAG_KEYS) {
          const enabled = resolveDefault(key);
          await db.execute(sql`
            INSERT INTO feature_flags (key, enabled, payload)
            VALUES (${key}, ${enabled}, '{}'::jsonb)
            ON CONFLICT (key) DO NOTHING
          `);
        }
        const res = await db.execute(sql`SELECT key, enabled FROM feature_flags`);
        const rows = (res as unknown as { rows?: { key: string; enabled: boolean }[] }).rows ?? [];
        for (const row of rows) {
          memFlags.set(row.key, Boolean(row.enabled));
        }
        for (const key of FLAG_KEYS) {
          const cfg = getConfig();
          if (key in cfg.featureFlagOverrides) {
            memFlags.set(key, cfg.featureFlagOverrides[key]!);
          } else if (typeof cfg.envFlagDefaults[key] === "boolean") {
            memFlags.set(key, cfg.envFlagDefaults[key]!);
          }
        }
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("flags bootstrap timeout")), 4_000),
      ),
    ]);
  } catch (err) {
    console.warn("[flags] bootstrap skipped (table may be missing):", err);
  }
}

export async function isEnabled(key: string): Promise<boolean> {
  if (!bootstrapped) await bootstrapFlags();
  if (memFlags.has(key)) return memFlags.get(key)!;
  return resolveDefault(key);
}

export function isEnabledSync(key: string): boolean {
  if (memFlags.has(key)) return memFlags.get(key)!;
  return resolveDefault(key);
}

export async function setFlag(key: string, enabled: boolean): Promise<void> {
  memFlags.set(key, enabled);
  const db = getDb();
  if (!db) return;
  try {
    await Promise.race([
      db.execute(sql`
        INSERT INTO feature_flags (key, enabled, updated_at)
        VALUES (${key}, ${enabled}, now())
        ON CONFLICT (key) DO UPDATE SET enabled = ${enabled}, updated_at = now()
      `),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("setFlag timeout")), 2_000),
      ),
    ]);
  } catch {
    // table may not exist yet — mem flag still applies
  }
}

export async function listFlags(): Promise<{ key: string; enabled: boolean }[]> {
  if (!bootstrapped) await bootstrapFlags();
  return FLAG_KEYS.map((key) => ({ key, enabled: memFlags.get(key) ?? resolveDefault(key) }));
}

/** Test helper */
export function resetFlagsForTests(): void {
  bootstrapped = false;
  memFlags.clear();
}
