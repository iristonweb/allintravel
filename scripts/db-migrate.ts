/**
 * Applies SQL migrations from migrations/ (requires DATABASE_URL in .env).
 * Uses per-statement connections to survive Supabase ECONNRESET on long sessions.
 */
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { pgPoolConfig } from "../server/db";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(projectRoot, "migrations");

async function withClient<T>(url: string, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const pool = new pg.Pool({
    ...pgPoolConfig(url, 1),
    connectionTimeoutMillis: 25_000,
  });
  pool.on("error", () => {});
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
    await pool.end();
  }
}

async function runStatement(url: string, sql: string, retries = 3): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await withClient(url, (client) => client.query(sql));
      return;
    } catch (err) {
      lastError = err;
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt < retries && (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ECONNREFUSED")) {
        console.warn(`[db:migrate] ${code}, retry ${attempt}/${retries - 1}…`);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function ensureMigrationsTable(url: string): Promise<void> {
  await withClient(url, async (client) => {
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
  });
}

async function appliedHashes(url: string): Promise<Set<string>> {
  return withClient(url, async (client) => {
    const res = await client.query<{ hash: string }>(`SELECT hash FROM drizzle.__drizzle_migrations`);
    return new Set(res.rows.map((r) => r.hash));
  });
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[db:migrate] DATABASE_URL is not set.");
    console.error("  Copy .env.example → .env and paste your Postgres connection string.");
    process.exit(1);
  }

  try {
    console.log("[db:migrate] Connecting…");
    await withClient(url, (client) => client.query("SELECT 1"));
    await ensureMigrationsTable(url);

    const done = await appliedHashes(url);
    const migrations = readMigrationFiles({ migrationsFolder });
    let applied = 0;

    for (const entry of migrations) {
      if (done.has(entry.hash)) continue;

      const statements = entry.sql.map((s) => s.trim()).filter(Boolean);
      console.log(`[db:migrate] migration ${entry.hash.slice(0, 12)}… (${statements.length} statements)`);

      for (let i = 0; i < statements.length; i++) {
        await runStatement(url, statements[i]!);
        if ((i + 1) % 10 === 0 || i + 1 === statements.length) {
          console.log(`[db:migrate]   ${i + 1}/${statements.length}`);
        }
      }

      await withClient(url, (client) =>
        client.query(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`, [
          entry.hash,
          entry.folderMillis,
        ]),
      );
      applied++;
      console.log(`[db:migrate] ✓ ${entry.hash.slice(0, 12)}…`);
    }

    if (applied === 0) {
      console.log("[db:migrate] Nothing pending — schema up to date.");
    } else {
      console.log(`[db:migrate] Done — applied ${applied} migration(s).`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[db:migrate] Failed:", message);

    if (/already exists|duplicate key/i.test(message)) {
      console.error("");
      console.error("  Tables already exist (often after npm run db:push).");
      console.error("  Mark the baseline migration as applied, then migrate again:");
      console.error("    npm run db:baseline");
      console.error("    npm run db:migrate");
    }

    process.exit(1);
  }
}

main();
