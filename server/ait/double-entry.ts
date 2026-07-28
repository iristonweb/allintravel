import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { incr, MetricNames } from "../observability/metrics";
import type { AitWallet } from "@shared/ait";

/** System account codes for the closed-loop AIT economy (not crypto). */
export const SYSTEM_ACCOUNTS = {
  emission: { code: "system:emission", name: "Emission", kind: "system" },
  burn: { code: "system:burn", name: "Burn", kind: "system" },
  platform: { code: "system:platform", name: "Platform", kind: "system" },
} as const;

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type TxLike = { execute: (q: ReturnType<typeof sql>) => Promise<unknown> };

async function ensureSystemAccounts(tx: TxLike): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const acct of Object.values(SYSTEM_ACCOUNTS)) {
    const id = genId("acct");
    await tx.execute(sql`
      INSERT INTO ait_ledger_accounts (id, code, name, kind)
      VALUES (${id}, ${acct.code}, ${acct.name}, ${acct.kind})
      ON CONFLICT (code) DO NOTHING
    `);
    const res = await tx.execute(sql`
      SELECT id FROM ait_ledger_accounts WHERE code = ${acct.code}
    `);
    const row = (res as unknown as { rows?: { id: string }[] }).rows?.[0];
    if (row) ids[acct.code] = row.id;
  }
  return ids;
}

async function ensureUserWalletAccount(
  tx: TxLike,
  userId: string,
  wallet: AitWallet,
): Promise<string> {
  const code = `user:${userId}:${wallet}`;
  const id = genId("acct");
  await tx.execute(sql`
    INSERT INTO ait_ledger_accounts (id, code, name, kind, user_id)
    VALUES (${id}, ${code}, ${`${wallet} wallet`}, ${"user"}, ${userId})
    ON CONFLICT (code) DO NOTHING
  `);
  const res = await tx.execute(sql`
    SELECT id FROM ait_ledger_accounts WHERE code = ${code}
  `);
  const row = (res as unknown as { rows?: { id: string }[] }).rows?.[0];
  if (!row) throw new Error("NO_LEDGER_ACCOUNT");
  return row.id;
}

/**
 * Dual-write balanced journal entry for an AIT balance delta.
 * Credit to user wallet on earn; debit from user + credit burn/platform on spend.
 */
export async function writeDoubleEntryJournal(
  tx: TxLike,
  opts: {
    txId: string;
    userId: string;
    wallet: AitWallet;
    delta: number;
    reason: string;
    title: string;
    idempotencyKey?: string | null;
  },
): Promise<void> {
  const amount = Math.abs(opts.delta);
  if (amount === 0) return;

  const systemIds = await ensureSystemAccounts(tx);
  const userAcctId = await ensureUserWalletAccount(tx, opts.userId, opts.wallet);
  const entryId = genId("jrn");

  await tx.execute(sql`
    INSERT INTO ait_journal_entries (id, tx_id, reason_code, title, idempotency_key)
    VALUES (
      ${entryId},
      ${opts.txId},
      ${opts.reason},
      ${opts.title},
      ${opts.idempotencyKey ?? null}
    )
  `);

  if (opts.delta > 0) {
    const emissionId = systemIds[SYSTEM_ACCOUNTS.emission.code];
    await tx.execute(sql`
      INSERT INTO ait_journal_lines (id, entry_id, account_id, debit, credit)
      VALUES (${genId("line")}, ${entryId}, ${emissionId}, ${amount}, 0)
    `);
    await tx.execute(sql`
      INSERT INTO ait_journal_lines (id, entry_id, account_id, debit, credit)
      VALUES (${genId("line")}, ${entryId}, ${userAcctId}, 0, ${amount})
    `);
  } else {
    const burnId = systemIds[SYSTEM_ACCOUNTS.burn.code];
    await tx.execute(sql`
      INSERT INTO ait_journal_lines (id, entry_id, account_id, debit, credit)
      VALUES (${genId("line")}, ${entryId}, ${userAcctId}, ${amount}, 0)
    `);
    await tx.execute(sql`
      INSERT INTO ait_journal_lines (id, entry_id, account_id, debit, credit)
      VALUES (${genId("line")}, ${entryId}, ${burnId}, 0, ${amount})
    `);
  }

  incr(MetricNames.aitJournalEntries);
  if (opts.delta > 0) incr(MetricNames.aitCredits);
  else incr(MetricNames.aitDebits);
}

/** Mem-mode no-op journal for tests without DB. */
const memJournal: Array<{ txId: string; debit: number; credit: number }> = [];

export function writeDoubleEntryJournalMem(opts: { txId: string; delta: number }): void {
  const amount = Math.abs(opts.delta);
  memJournal.push({ txId: opts.txId, debit: amount, credit: amount });
  incr(MetricNames.aitJournalEntries);
}

export function getMemJournalForTests(): typeof memJournal {
  return memJournal;
}

export function resetMemJournalForTests(): void {
  memJournal.length = 0;
}

export async function seedSystemAccountsIfNeeded(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.transaction(async (tx) => {
      await ensureSystemAccounts(tx);
    });
  } catch {
    // table may not exist yet
  }
}
