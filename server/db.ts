import "dotenv/config";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool as NodePgPool } from "pg";
import * as schema from "@shared/schema";

type AppDb = ReturnType<typeof drizzleNodePg<typeof schema>>;

let poolInstance: NodePgPool | null = null;
let sessionPoolInstance: NodePgPool | null = null;
let dbInstance: AppDb | null = null;

function databaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() || null;
}

function needsSsl(url: string): boolean {
  return (
    url.includes("neon.tech") ||
    url.includes("sslmode=require") ||
    url.includes("ssl=true")
  );
}

function pgPoolOptions(url: string, max: number) {
  return {
    connectionString: url,
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    ...(needsSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

/** node-postgres pool for express-session (connect-pg-simple). */
export function getSessionPool(): NodePgPool | null {
  const url = databaseUrl();
  if (!url) return null;
  if (sessionPoolInstance) return sessionPoolInstance;

  sessionPoolInstance = new NodePgPool(pgPoolOptions(url, process.env.VERCEL ? 1 : 5));
  return sessionPoolInstance;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl());
}

/**
 * Use node-postgres everywhere (including Vercel) — avoids Neon WebSocket driver
 * which can crash serverless cold starts.
 */
export function getPool(): NodePgPool | null {
  const url = databaseUrl();
  if (!url) return null;
  if (poolInstance) return poolInstance;

  poolInstance = new NodePgPool(pgPoolOptions(url, process.env.VERCEL ? 2 : 10));
  return poolInstance;
}

export function getDb(): AppDb | null {
  if (!databaseUrl()) return null;
  if (dbInstance) return dbInstance;

  const pool = getPool();
  if (!pool) return null;

  dbInstance = drizzleNodePg(pool, { schema });
  return dbInstance;
}

/** @deprecated Use getDb() — throws when DATABASE_URL is unset */
export const db = new Proxy({} as AppDb, {
  get(_target, prop) {
    const real = getDb();
    if (!real) {
      throw new Error("DATABASE_URL must be set.");
    }
    return Reflect.get(real, prop);
  },
});

export const pool = new Proxy({} as NodePgPool, {
  get(_target, prop) {
    const real = getPool();
    if (!real) {
      throw new Error("DATABASE_URL must be set.");
    }
    return Reflect.get(real, prop);
  },
});
