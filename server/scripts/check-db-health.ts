/**
 * Quick DB diagnostic: npm run db:check
 * Requires DATABASE_URL in .env (same as Vercel production Postgres URL).
 */
import "dotenv/config";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const db = getDb();
  if (!db) {
    console.error("Could not create DB connection");
    process.exit(1);
  }

  console.log("Connecting…");
  await db.execute(sql`SELECT 1`);
  console.log("OK: connected");

  const cols = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY 1`,
  );
  const columnNames = (cols.rows as { column_name: string }[]).map((r) => r.column_name);
  console.log("users columns:", columnNames.join(", "));

  if (!columnNames.includes("password_hash")) {
    console.error("MISSING: password_hash — run: npm run db:push");
    process.exit(1);
  }

  for (const table of ["users", "places", "trips", "sessions", "travel_posts"]) {
    try {
      const r = await db.execute(sql.raw(`SELECT count(*)::int AS c FROM "${table}"`));
      const count = (r.rows as { c: number }[])[0]?.c ?? "?";
      console.log(`  ${table}: ${count} rows`);
    } catch {
      console.log(`  ${table}: (table missing or error)`);
    }
  }

  console.log("\nDatabase looks ready for All In Travel.");
}

main().catch((e) => {
  console.error("DB check failed:", e);
  process.exit(1);
});
