import { sql } from "drizzle-orm";
import { getDb } from "./db";

const memBookmarks = new Map<string, Set<string>>();

export async function ensureBookmarkSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS post_bookmarks (
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id uuid NOT NULL REFERENCES travel_posts(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (user_id, post_id)
    )
  `);
}

export async function listBookmarkedPostIds(userId: string): Promise<string[]> {
  await ensureBookmarkSchema();
  const db = getDb();
  if (!db) {
    return Array.from(memBookmarks.get(userId) ?? []);
  }
  const res = await db.execute(sql`
    SELECT post_id FROM post_bookmarks WHERE user_id = ${userId} ORDER BY created_at DESC
  `);
  return (
    (res as unknown as { rows?: { post_id: string }[] }).rows?.map((r) => r.post_id) ?? []
  );
}

export async function isPostBookmarked(userId: string, postId: string): Promise<boolean> {
  await ensureBookmarkSchema();
  const db = getDb();
  if (!db) return memBookmarks.get(userId)?.has(postId) ?? false;
  const res = await db.execute(sql`
    SELECT 1 FROM post_bookmarks WHERE user_id = ${userId} AND post_id = ${postId} LIMIT 1
  `);
  return Boolean((res as unknown as { rows?: unknown[] }).rows?.length);
}

export async function addPostBookmark(userId: string, postId: string): Promise<void> {
  await ensureBookmarkSchema();
  const db = getDb();
  if (!db) {
    let set = memBookmarks.get(userId);
    if (!set) {
      set = new Set();
      memBookmarks.set(userId, set);
    }
    set.add(postId);
    return;
  }
  await db.execute(sql`
    INSERT INTO post_bookmarks (user_id, post_id) VALUES (${userId}, ${postId})
    ON CONFLICT DO NOTHING
  `);
}

export async function removePostBookmark(userId: string, postId: string): Promise<void> {
  await ensureBookmarkSchema();
  const db = getDb();
  if (!db) {
    memBookmarks.get(userId)?.delete(postId);
    return;
  }
  await db.execute(sql`
    DELETE FROM post_bookmarks WHERE user_id = ${userId} AND post_id = ${postId}
  `);
}
