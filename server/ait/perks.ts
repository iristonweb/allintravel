import { sql } from "drizzle-orm";
import { getDb } from "../db";
import * as store from "./store";

const memPostBoosts = new Map<string, Date>();
const CREATOR_BADGE_SKU = "creator_badge";

export async function addPostBoost(postId: string, userId: string, hours = 24): Promise<void> {
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  const db = getDb();
  if (!db) {
    memPostBoosts.set(postId, expiresAt);
    return;
  }
  await db.execute(sql`
    INSERT INTO ait_post_boosts (post_id, user_id, expires_at)
    VALUES (${postId}, ${userId}, ${expiresAt})
    ON CONFLICT (post_id) DO UPDATE SET expires_at = ${expiresAt}, user_id = ${userId}
  `);
}

export async function getActiveBoostedPostIds(): Promise<Set<string>> {
  const db = getDb();
  const now = new Date();
  if (!db) {
    const out = new Set<string>();
    for (const [postId, exp] of Array.from(memPostBoosts.entries())) {
      if (exp > now) out.add(postId);
    }
    return out;
  }
  const res = await db.execute(sql`
    SELECT post_id FROM ait_post_boosts WHERE expires_at > now()
  `);
  const rows = (res as unknown as { rows?: { post_id: string }[] }).rows ?? [];
  return new Set(rows.map((r) => r.post_id));
}

export async function getUsersWithCreatorBadge(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const unique = Array.from(new Set(userIds));
  const out = new Set<string>();
  for (const id of unique) {
    const ents = await store.getEntitlements(id);
    if (ents.some((e) => e.sku === CREATOR_BADGE_SKU)) out.add(id);
  }
  return out;
}

export async function getRoomsWithSpotlight(roomIds: string[]): Promise<Set<string>> {
  return store.getActiveSpotlightRoomIds(roomIds);
}

export function sortPostsWithBoosts<T extends { id: string; createdAt?: Date | string | null }>(
  posts: T[],
  boosted: Set<string>,
): T[] {
  return [...posts].sort((a, b) => {
    const ab = boosted.has(a.id) ? 1 : 0;
    const bb = boosted.has(b.id) ? 1 : 0;
    if (ab !== bb) return bb - ab;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export function sortRoomsWithSpotlight<T extends { id: string; createdBy?: string | null }>(
  rooms: T[],
  spotlightRooms: Set<string>,
): T[] {
  return [...rooms].sort((a, b) => {
    const as = spotlightRooms.has(a.id) ? 1 : 0;
    const bs = spotlightRooms.has(b.id) ? 1 : 0;
    if (as !== bs) return bs - as;
    return 0;
  });
}

const DEFAULT_MAX_OWNED_CHAT_ROOMS = 2;
const EXTRA_CHAT_ROOM_SKU = "extra_chat_room";

export async function countOwnedChatRooms(userId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const res = await db.execute(sql`
    SELECT count(*)::int AS c FROM chat_rooms WHERE created_by = ${userId}
  `);
  return Number((res as unknown as { rows?: { c: number }[] }).rows?.[0]?.c ?? 0);
}

export async function getMaxOwnedChatRooms(userId: string): Promise<number> {
  const ents = await store.getEntitlements(userId);
  const extras = ents.filter((e) => e.sku === EXTRA_CHAT_ROOM_SKU).length;
  return DEFAULT_MAX_OWNED_CHAT_ROOMS + extras;
}

export async function canCreateChatRoom(userId: string): Promise<boolean> {
  const [owned, max] = await Promise.all([
    countOwnedChatRooms(userId),
    getMaxOwnedChatRooms(userId),
  ]);
  return owned < max;
}
