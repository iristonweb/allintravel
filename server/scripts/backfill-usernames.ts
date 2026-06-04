/**
 * Backfill unique usernames for users missing one.
 * Run: npm run db:backfill-usernames
 */
import { initAppStorage, storage } from "../storage";

async function main() {
  await initAppStorage();
  if (!storage.ensureUsernames) {
    console.log("Storage backend does not support ensureUsernames.");
    process.exit(0);
  }
  await storage.ensureUsernames();
  console.log("Username backfill complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
