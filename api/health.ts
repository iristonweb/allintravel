import type { Request, Response } from "express";

export const config = { maxDuration: 30 };

/** Lightweight health check — does not load full Express app. */
export default async function handler(_req: Request, res: Response) {
  let database = false;
  let dbError: string | undefined;

  if (process.env.DATABASE_URL) {
    try {
      const { getDb } = await import("../server/db");
      const db = getDb();
      if (db) {
        const { sql } = await import("drizzle-orm");
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
