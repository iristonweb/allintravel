import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export const config = { maxDuration: 30 };

export default async function handler(_req: Request, res: Response) {
  let database = false;
  let dbError: string | undefined;

  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      if (db) {
        await db.execute(sql`SELECT 1`);
        database = true;
      }
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  res.status(200).json({
    ok: true,
    lite: true,
    vercel: Boolean(process.env.VERCEL),
    databaseUrl: Boolean(process.env.DATABASE_URL),
    database,
    dbError,
    sessionSecret: Boolean(process.env.SESSION_SECRET),
  });
}
