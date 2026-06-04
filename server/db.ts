import "dotenv/config";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool as NodePgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

type AppDb = ReturnType<typeof drizzleNodePg<typeof schema>>;

let poolInstance: NodePgPool | NeonPool | null = null;
let dbInstance: AppDb | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): NodePgPool | NeonPool | null {
  if (!process.env.DATABASE_URL) return null;
  if (poolInstance) return poolInstance;

  const databaseUrl = process.env.DATABASE_URL;
  const host = (() => {
    try {
      return new URL(databaseUrl).hostname;
    } catch {
      return "";
    }
  })();

  const isLocal = host === "localhost" || host === "127.0.0.1";
  poolInstance = isLocal
    ? new NodePgPool({ connectionString: databaseUrl })
    : new NeonPool({ connectionString: databaseUrl });

  return poolInstance;
}

export function getDb(): AppDb | null {
  if (!process.env.DATABASE_URL) return null;
  if (dbInstance) return dbInstance;

  const pool = getPool();
  if (!pool) return null;

  const databaseUrl = process.env.DATABASE_URL;
  const host = (() => {
    try {
      return new URL(databaseUrl).hostname;
    } catch {
      return "";
    }
  })();

  const isLocal = host === "localhost" || host === "127.0.0.1";
  dbInstance = isLocal
    ? drizzleNodePg(pool as NodePgPool, { schema })
    : (drizzleNeon({ client: pool as NeonPool, schema }) as unknown as AppDb);

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
