import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { weekKey } from "./store";
import * as store from "./store";

export type LeaderboardEntry = {
  userId: string;
  earned: number;
  rank: number;
};

const memLeaderboardCache = new Map<string, LeaderboardEntry[]>();

export async function getWeeklyCreatorLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const wk = weekKey();
  const cached = memLeaderboardCache.get(wk);
  if (cached) return cached.slice(0, limit);

  const db = getDb();
  let rows: { user_id: string; earned: number }[] = [];

  if (!db) {
    const byUser = new Map<string, number>();
    const now = Date.now();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    for (const t of store.getMemTransactions()) {
      if (t.wallet !== "creator" || t.delta <= 0) continue;
      if (t.createdAt.getTime() < weekStart.getTime()) continue;
      byUser.set(t.userId, (byUser.get(t.userId) ?? 0) + t.delta);
    }
    rows = Array.from(byUser.entries())
      .map(([user_id, earned]) => ({ user_id, earned }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, limit);
  } else {
    const res = await db.execute(sql`
      SELECT user_id, COALESCE(SUM(delta), 0)::int AS earned
      FROM ait_transactions
      WHERE wallet = 'creator' AND delta > 0
        AND created_at >= (now() - interval '7 days')
      GROUP BY user_id
      ORDER BY earned DESC
      LIMIT ${limit}
    `);
    rows = (res as unknown as { rows?: { user_id: string; earned: number }[] }).rows ?? [];
  }

  const entries: LeaderboardEntry[] = rows.map((r, i) => ({
    userId: r.user_id,
    earned: Number(r.earned),
    rank: i + 1,
  }));
  memLeaderboardCache.set(wk, entries);
  return entries.slice(0, limit);
}
