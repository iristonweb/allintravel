import "dotenv/config";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool as NodePgPool } from "pg";
import * as schema from "@shared/schema";

type AppDb = ReturnType<typeof drizzleNodePg<typeof schema>>;

let poolInstance: NodePgPool | null = null;
let dbInstance: AppDb | null = null;

function databaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() || null;
}

function needsSsl(url: string): boolean {
  return (
    url.includes("neon.tech") ||
    url.includes("supabase.co") ||
    url.includes("pooler.supabase.com") ||
    url.includes("sslmode=require") ||
    url.includes("ssl=true")
  );
}

/** pg v8 treats sslmode=require in the URL as verify-full; strip it and use explicit ssl instead. */
function stripConnectionSslParams(url: string): string {
  return url
    .replace(/([?&])sslmode=[^&]*&?/g, (_, sep) => (sep === "?" ? "?" : "&"))
    .replace(/([?&])ssl=true&?/gi, (_, sep) => (sep === "?" ? "?" : "&"))
    .replace(/[?&]$/, "");
}

export function pgPoolConfig(url: string, max: number) {
  const sslRequired = needsSsl(url);
  return {
    connectionString: sslRequired ? stripConnectionSslParams(url) : url,
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    ...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function pgPoolOptions(url: string, max: number) {
  return pgPoolConfig(url, max);
}

/** Shared pool for Drizzle + express-session (fewer Neon connections on serverless). */
export function getSessionPool(): NodePgPool | null {
  return getPool();
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

  poolInstance = new NodePgPool(pgPoolOptions(url, process.env.VERCEL ? 4 : 10));
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
