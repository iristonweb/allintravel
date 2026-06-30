import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { pgPoolConfig } from "./server/db";

/** Placeholder for `drizzle-kit generate` when DATABASE_URL is unset locally. */
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/all_in_travel?sslmode=disable";

const poolConfig = pgPoolConfig(databaseUrl, 1);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: poolConfig.connectionString,
    ssl: poolConfig.ssl,
  },
});
