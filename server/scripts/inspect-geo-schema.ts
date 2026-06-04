import "dotenv/config";
import pg from "pg";

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
    const geonameCols = await pool.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND column_name = 'geoname_id'`,
    );
    console.log("all geoname_id columns:", geonameCols.rows);

    const allTables = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );
    console.log("public tables:", allTables.rows.map((r) => r.table_name));

    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('cities', 'countries')
       ORDER BY table_name`,
    );
    console.log("geo tables:", tables.rows);

    for (const name of ["cities", "countries"]) {
      const cols = await pool.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [name],
      );
      const pk = await pool.query(
        `SELECT a.attname AS column_name
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
         WHERE i.indrelid = $1::regclass AND i.indisprimary`,
        [name],
      );
      const indexes = await pool.query(
        `SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = 'public' AND tablename = $1`,
        [name],
      );
      console.log(`\n${name} columns:`, cols.rows);
      console.log(`${name} primary key:`, pk.rows);
      console.log(`${name} indexes:`, indexes.rows);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
