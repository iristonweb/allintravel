import "dotenv/config";
import { getDb } from "../db";
import { PgStorage } from "../pg-storage";

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const storage = new PgStorage(db);
  await storage.ensureSeeded();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
