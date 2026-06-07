import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/** Placeholder for `drizzle-kit generate` when DATABASE_URL is unset locally. */
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/all_in_travel?sslmode=disable";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
