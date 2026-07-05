import { closePool } from "./db";

const RETRY_ATTEMPTS = 5;

/** Supabase session pooler (5432) chokes on bulk writes — use transaction pooler for imports. */
export function configureBulkImportEnv(): void {
  process.env.PG_POOL_MAX = "1";

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return;

  const u = new URL(raw);
  if (u.hostname.includes("pooler.supabase.com") && u.port !== "6543") {
    u.port = "6543";
    process.env.DATABASE_URL = u.toString();
  }
}

export async function withRetry(label: string, fn: () => Promise<unknown>): Promise<void> {
  let attempts = 0;
  while (attempts < RETRY_ATTEMPTS) {
    try {
      await fn();
      return;
    } catch (err) {
      attempts += 1;
      if (attempts >= RETRY_ATTEMPTS) throw err;
      const delayMs = 2000 * attempts;
      console.warn(`${label} retry ${attempts}/${RETRY_ATTEMPTS - 1}:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function closeImportConnection(): Promise<void> {
  await closePool();
}
