/**
 * Applies SQL migrations from migrations/ (requires DATABASE_URL in .env).
 * Clearer errors than raw drizzle-kit on Windows + Neon.
 */
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(projectRoot, "migrations");

function needsSsl(url: string): boolean {
  return url.includes("neon.tech") || url.includes("sslmode=require") || url.includes("ssl=true");
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[db:migrate] DATABASE_URL is not set.");
    console.error("  Copy .env.example → .env and paste your Neon connection string.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 25_000,
    ...(needsSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    console.log("[db:migrate] Connecting…");
    await pool.query("SELECT 1");
    console.log("[db:migrate] Applying migrations from migrations/ …");

    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });

    console.log("[db:migrate] Done — all pending migrations applied.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[db:migrate] Failed:", message);

    if (/already exists|duplicate key/i.test(message)) {
      console.error("");
      console.error("  Tables already exist (often after npm run db:push).");
      console.error("  Mark the baseline migration as applied, then migrate again:");
      console.error("    npm run db:baseline");
      console.error("    npm run db:migrate");
      console.error("");
      console.error("  Or sync schema without migration files: npm run db:push");
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
