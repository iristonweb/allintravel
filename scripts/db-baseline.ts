/**
 * Mark migrations as applied without running SQL — for DBs already synced via db:push.
 * Safe to re-run: skips migrations already recorded in drizzle.__drizzle_migrations.
 */
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { readMigrationFiles } from "drizzle-orm/migrator";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(projectRoot, "migrations");

function needsSsl(url: string): boolean {
  return url.includes("neon.tech") || url.includes("sslmode=require") || url.includes("ssl=true");
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[db:baseline] DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 25_000,
    ...(needsSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    await pool.query("SELECT 1");

    const users = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists`,
    );
    if (!users.rows[0]?.exists) {
      console.error("[db:baseline] Table public.users not found.");
      console.error("  Create schema first: npm run db:push");
      process.exit(1);
    }

    await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const migrations = readMigrationFiles({ migrationsFolder });
    let inserted = 0;

    for (const entry of migrations) {
      const existing = await pool.query<{ id: number }>(
        `SELECT id FROM drizzle.__drizzle_migrations WHERE hash = $1 LIMIT 1`,
        [entry.hash],
      );
      if (existing.rowCount && existing.rowCount > 0) continue;

      await pool.query(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`, [
        entry.hash,
        entry.folderMillis,
      ]);
      inserted++;
      console.log(`[db:baseline] Recorded migration ${entry.hash.slice(0, 12)}…`);
    }

    if (inserted === 0) {
      console.log("[db:baseline] All migrations already recorded — nothing to do.");
    } else {
      console.log(`[db:baseline] Done — recorded ${inserted} migration(s).`);
    }
  } catch (err) {
    console.error("[db:baseline] Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
