import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export const config = { maxDuration: 30 };

export default async function handler(_req: Request, res: Response) {
  let database = false;

  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      if (db) {
        await db.execute(sql`SELECT 1`);
        database = true;
      }
    } catch {
      database = false;
    }
  }

  res.status(200).json({ ok: true, database });
}
