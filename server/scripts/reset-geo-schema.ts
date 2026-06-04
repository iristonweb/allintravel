import "dotenv/config";
import pg from "pg";

/**
 * Drops geo reference tables when drizzle-kit push fails on cities/countries.
 * Re-run: npm run db:push && npm run geo:import
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const needsSsl =
    url.includes("neon.tech") || url.includes("sslmode=require") || url.includes("ssl=true");

  const pool = new pg.Pool({
    connectionString: url,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    await pool.query(`DROP TABLE IF EXISTS cities CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS countries CASCADE`);
    console.log("Dropped tables: cities, countries");
    console.log("Next: npm run db:push");
    console.log("Optional: npm run geo:import");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
