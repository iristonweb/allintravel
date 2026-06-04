/**
 * Privacy, presence, chat rooms — mixed into PgStorage via re-exported helpers.
 * Kept separate to limit pg-storage.ts size.
 */
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { UserPrivacySettings } from "@shared/privacy";
import { DEFAULT_PRIVACY_SETTINGS } from "@shared/privacy";
import type {
  ChatMessage,
  ChatRoom,
  ChatRoomInvite,
  ChatRoomMember,
  InsertChatMessage,
  InsertUserTrack,
  PrivateMessage,
  User,
  UserPresence,
  UserTrack,
  AdminBroadcast,
  InsertAdminBroadcast,
} from "@shared/schema";
import {
  adminBroadcastDismissals,
  adminBroadcasts,
  chatMessageLikes,
  chatMessageReactions,
  chatMessages,
  chatPinnedMessages,
  chatRoomInvites,
  chatRoomMembers,
  chatRoomReadCursors,
  chatRooms,
  friendships,
  privateMessageLikes,
  privateMessageReactions,
  privateMessages,
  userPresence,
  userPrivacySettings,
  userProfiles,
  userTracks,
  users,
} from "@shared/schema";
import { LEGACY_CHAT_ROOM_SEEDS } from "./legacy-chat-rooms";
import { defaultPrivacyRow, rowToPrivacySettings } from "./privacy-helpers";
import type { Db } from "./pg-storage-types";

export type PgFeaturesDb = Db;

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "room";
}

import * as notifStore from "./notification-storage";

export async function ensureExtendedSchema(db: PgFeaturesDb): Promise<void> {
  await notifStore.ensureNotificationSchema(db);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_privacy_settings (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      is_private_account boolean NOT NULL DEFAULT false,
      show_online_status varchar(20) NOT NULL DEFAULT 'friends',
      show_last_seen boolean NOT NULL DEFAULT true,
      allow_dm_from varchar(20) NOT NULL DEFAULT 'friends',
      allow_friend_requests_from varchar(20) NOT NULL DEFAULT 'everyone',
      show_profile_to varchar(20) NOT NULL DEFAULT 'everyone',
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      is_online boolean NOT NULL DEFAULT false,
      last_seen_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`ALTER TABLE friendships ADD COLUMN IF NOT EXISTS direction varchar(32)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug varchar(100) NOT NULL UNIQUE,
      title varchar(120) NOT NULL,
      description text,
      avatar_url varchar,
      visibility varchar(20) NOT NULL DEFAULT 'public',
      created_by varchar REFERENCES users(id) ON DELETE SET NULL,
      settings jsonb,
      is_legacy boolean DEFAULT false,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_room_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role varchar(20) NOT NULL DEFAULT 'member',
      status varchar(20) NOT NULL DEFAULT 'active',
      joined_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_room_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      token varchar(64) NOT NULL UNIQUE,
      created_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamp,
      max_uses integer,
      use_count integer DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_pinned_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      pinned_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pinned_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS updated_at timestamp`);
  await db.execute(sql`ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS updated_at timestamp`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_message_likes (
      message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS private_message_likes (
      message_id uuid NOT NULL REFERENCES private_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji varchar(16) NOT NULL,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS private_message_reactions (
      message_id uuid NOT NULL REFERENCES private_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji varchar(16) NOT NULL,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db.execute(sql`
    INSERT INTO chat_message_reactions (message_id, user_id, emoji, created_at)
    SELECT message_id, user_id, ${"❤️"}, created_at FROM chat_message_likes
    ON CONFLICT (message_id, user_id) DO NOTHING
  `);
  await db.execute(sql`
    INSERT INTO private_message_reactions (message_id, user_id, emoji, created_at)
    SELECT message_id, user_id, ${"❤️"}, created_at FROM private_message_likes
    ON CONFLICT (message_id, user_id) DO NOTHING
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_room_read_cursors (
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
      updated_at timestamp DEFAULT now(),
      PRIMARY KEY (room_id, user_id)
    )
  `);
  await db.execute(sql`ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS delivered_at timestamp`);
  await db.execute(sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS image_url varchar(500)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_tracks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      file_url varchar(500) NOT NULL,
      mime_type varchar(50),
      file_size_bytes integer,
      duration_seconds integer,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_user_tracks_user" ON user_tracks (user_id)`);
  await db.execute(sql`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS artist varchar(200)`);
  await db.execute(sql`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS source_provider varchar(50)`);
  await db.execute(sql`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS source_id varchar(100)`);
  await db.execute(sql`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS license varchar(100)`);
  await db.execute(sql`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS is_preview boolean DEFAULT false`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_broadcasts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content text NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      expires_at timestamp,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_broadcast_dismissals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      broadcast_id uuid NOT NULL REFERENCES admin_broadcasts(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action varchar(20) NOT NULL,
      dismissed_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS IDX_broadcast_dismissal_user
    ON admin_broadcast_dismissals (broadcast_id, user_id)
  `);
}

export type MessageLikeMeta = { likeCount: number; likedByMe: boolean };

export type ReactionSummary = { emoji: string; count: number; reactedByMe: boolean };

export type MessageReactionsMeta = { reactions: ReactionSummary[] };

export type MessageDeliveryStatus = "sent" | "delivered" | "read";

const DEFAULT_HEART = "❤️";

export const QUICK_REACTION_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮", "😢", "🎉", "👏"] as const;

export async function getChatMessageDb(db: PgFeaturesDb, messageId: string): Promise<ChatMessage | undefined> {
  const [row] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  return row;
}

export async function updateChatMessageDb(
  db: PgFeaturesDb,
  messageId: string,
  content: string,
): Promise<ChatMessage | undefined> {
  const [row] = await db
    .update(chatMessages)
    .set({ content, updatedAt: new Date() })
    .where(eq(chatMessages.id, messageId))
    .returning();
  return row;
}

export async function getPrivateMessageDb(
  db: PgFeaturesDb,
  messageId: string,
): Promise<PrivateMessage | undefined> {
  const [row] = await db.select().from(privateMessages).where(eq(privateMessages.id, messageId)).limit(1);
  return row;
}

export async function updatePrivateMessageDb(
  db: PgFeaturesDb,
  messageId: string,
  content: string,
): Promise<PrivateMessage | undefined> {
  const [row] = await db
    .update(privateMessages)
    .set({ content, updatedAt: new Date() })
    .where(eq(privateMessages.id, messageId))
    .returning();
  return row;
}

export async function deletePrivateMessageDb(db: PgFeaturesDb, messageId: string): Promise<void> {
  await db.delete(privateMessages).where(eq(privateMessages.id, messageId));
}

async function likeMetaForIds(
  db: PgFeaturesDb,
  table: typeof chatMessageLikes | typeof privateMessageLikes,
  messageIds: string[],
  viewerId: string,
): Promise<Record<string, MessageLikeMeta>> {
  const out: Record<string, MessageLikeMeta> = {};
  if (messageIds.length === 0) return out;
  const counts = await db
    .select({
      messageId: table.messageId,
      cnt: count(),
    })
    .from(table)
    .where(inArray(table.messageId, messageIds))
    .groupBy(table.messageId);
  for (const id of messageIds) {
    out[id] = { likeCount: 0, likedByMe: false };
  }
  for (const row of counts) {
    out[row.messageId] = { likeCount: Number(row.cnt), likedByMe: false };
  }
  const mine = await db
    .select({ messageId: table.messageId })
    .from(table)
    .where(and(inArray(table.messageId, messageIds), eq(table.userId, viewerId)));
  for (const row of mine) {
    if (out[row.messageId]) out[row.messageId].likedByMe = true;
  }
  return out;
}

export async function getChatMessageLikeMetaDb(
  db: PgFeaturesDb,
  messageIds: string[],
  viewerId: string,
): Promise<Record<string, MessageLikeMeta>> {
  return likeMetaForIds(db, chatMessageLikes, messageIds, viewerId);
}

export async function getPrivateMessageLikeMetaDb(
  db: PgFeaturesDb,
  messageIds: string[],
  viewerId: string,
): Promise<Record<string, MessageLikeMeta>> {
  return likeMetaForIds(db, privateMessageLikes, messageIds, viewerId);
}

export async function toggleChatMessageLikeDb(
  db: PgFeaturesDb,
  messageId: string,
  userId: string,
): Promise<MessageLikeMeta> {
  const [existing] = await db
    .select()
    .from(chatMessageLikes)
    .where(and(eq(chatMessageLikes.messageId, messageId), eq(chatMessageLikes.userId, userId)))
    .limit(1);
  if (existing) {
    await db
      .delete(chatMessageLikes)
      .where(and(eq(chatMessageLikes.messageId, messageId), eq(chatMessageLikes.userId, userId)));
  } else {
    await db.insert(chatMessageLikes).values({ messageId, userId });
  }
  const meta = await getChatMessageLikeMetaDb(db, [messageId], userId);
  return meta[messageId] ?? { likeCount: 0, likedByMe: false };
}

export async function togglePrivateMessageLikeDb(
  db: PgFeaturesDb,
  messageId: string,
  userId: string,
): Promise<MessageLikeMeta> {
  const [existing] = await db
    .select()
    .from(privateMessageLikes)
    .where(and(eq(privateMessageLikes.messageId, messageId), eq(privateMessageLikes.userId, userId)))
    .limit(1);
  if (existing) {
    await db
      .delete(privateMessageLikes)
      .where(and(eq(privateMessageLikes.messageId, messageId), eq(privateMessageLikes.userId, userId)));
  } else {
    await db.insert(privateMessageLikes).values({ messageId, userId });
  }
  const meta = await getPrivateMessageLikeMetaDb(db, [messageId], userId);
  return meta[messageId] ?? { likeCount: 0, likedByMe: false };
}

async function reactionsMetaForIds(
  db: PgFeaturesDb,
  table: typeof chatMessageReactions | typeof privateMessageReactions,
  messageIds: string[],
  viewerId: string,
): Promise<Record<string, MessageReactionsMeta>> {
  const out: Record<string, MessageReactionsMeta> = {};
  if (messageIds.length === 0) return out;
  for (const id of messageIds) out[id] = { reactions: [] };

  const rows = await db
    .select({
      messageId: table.messageId,
      emoji: table.emoji,
      userId: table.userId,
    })
    .from(table)
    .where(inArray(table.messageId, messageIds));

  const grouped = new Map<string, Map<string, { count: number; reactedByMe: boolean }>>();
  for (const id of messageIds) grouped.set(id, new Map());

  for (const row of rows) {
    const byEmoji = grouped.get(row.messageId)!;
    const existing = byEmoji.get(row.emoji) ?? { count: 0, reactedByMe: false };
    existing.count += 1;
    if (row.userId === viewerId) existing.reactedByMe = true;
    byEmoji.set(row.emoji, existing);
  }

  for (const [messageId, byEmoji] of Array.from(grouped.entries())) {
    out[messageId] = {
      reactions: Array.from(byEmoji.entries())
        .map(([emoji, v]) => ({ emoji, count: v.count, reactedByMe: v.reactedByMe }))
        .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji)),
    };
  }
  return out;
}

export async function getChatMessageReactionsMetaDb(
  db: PgFeaturesDb,
  messageIds: string[],
  viewerId: string,
): Promise<Record<string, MessageReactionsMeta>> {
  return reactionsMetaForIds(db, chatMessageReactions, messageIds, viewerId);
}

export async function getPrivateMessageReactionsMetaDb(
  db: PgFeaturesDb,
  messageIds: string[],
  viewerId: string,
): Promise<Record<string, MessageReactionsMeta>> {
  return reactionsMetaForIds(db, privateMessageReactions, messageIds, viewerId);
}

export async function setChatMessageReactionDb(
  db: PgFeaturesDb,
  messageId: string,
  userId: string,
  emoji: string | null,
): Promise<MessageReactionsMeta> {
  if (!emoji) {
    await db
      .delete(chatMessageReactions)
      .where(and(eq(chatMessageReactions.messageId, messageId), eq(chatMessageReactions.userId, userId)));
  } else {
    await db
      .insert(chatMessageReactions)
      .values({ messageId, userId, emoji })
      .onConflictDoUpdate({
        target: [chatMessageReactions.messageId, chatMessageReactions.userId],
        set: { emoji, createdAt: new Date() },
      });
  }
  const meta = await getChatMessageReactionsMetaDb(db, [messageId], userId);
  return meta[messageId] ?? { reactions: [] };
}

export async function setPrivateMessageReactionDb(
  db: PgFeaturesDb,
  messageId: string,
  userId: string,
  emoji: string | null,
): Promise<MessageReactionsMeta> {
  if (!emoji) {
    await db
      .delete(privateMessageReactions)
      .where(and(eq(privateMessageReactions.messageId, messageId), eq(privateMessageReactions.userId, userId)));
  } else {
    await db
      .insert(privateMessageReactions)
      .values({ messageId, userId, emoji })
      .onConflictDoUpdate({
        target: [privateMessageReactions.messageId, privateMessageReactions.userId],
        set: { emoji, createdAt: new Date() },
      });
  }
  const meta = await getPrivateMessageReactionsMetaDb(db, [messageId], userId);
  return meta[messageId] ?? { reactions: [] };
}

export async function getChatMessageReactionDetailsDb(
  db: PgFeaturesDb,
  messageId: string,
): Promise<{ emoji: string; users: User[] }[]> {
  const rows = await db
    .select({
      emoji: chatMessageReactions.emoji,
      userId: chatMessageReactions.userId,
    })
    .from(chatMessageReactions)
    .where(eq(chatMessageReactions.messageId, messageId));

  const byEmoji = new Map<string, string[]>();
  for (const row of rows) {
    const list = byEmoji.get(row.emoji) ?? [];
    list.push(row.userId);
    byEmoji.set(row.emoji, list);
  }

  const result: { emoji: string; users: User[] }[] = [];
  for (const [emoji, userIds] of Array.from(byEmoji.entries())) {
    if (userIds.length === 0) continue;
    const userRows = await db.select().from(users).where(inArray(users.id, userIds));
    result.push({ emoji, users: userRows });
  }
  return result.sort((a, b) => b.users.length - a.users.length || a.emoji.localeCompare(b.emoji));
}

export async function getPrivateMessageReactionDetailsDb(
  db: PgFeaturesDb,
  messageId: string,
): Promise<{ emoji: string; users: User[] }[]> {
  const rows = await db
    .select({
      emoji: privateMessageReactions.emoji,
      userId: privateMessageReactions.userId,
    })
    .from(privateMessageReactions)
    .where(eq(privateMessageReactions.messageId, messageId));

  const byEmoji = new Map<string, string[]>();
  for (const row of rows) {
    const list = byEmoji.get(row.emoji) ?? [];
    list.push(row.userId);
    byEmoji.set(row.emoji, list);
  }

  const result: { emoji: string; users: User[] }[] = [];
  for (const [emoji, userIds] of Array.from(byEmoji.entries())) {
    if (userIds.length === 0) continue;
    const userRows = await db.select().from(users).where(inArray(users.id, userIds));
    result.push({ emoji, users: userRows });
  }
  return result.sort((a, b) => b.users.length - a.users.length || a.emoji.localeCompare(b.emoji));
}

export async function upsertChatRoomReadCursorDb(
  db: PgFeaturesDb,
  roomId: string,
  userId: string,
  lastReadMessageId: string,
): Promise<void> {
  await db
    .insert(chatRoomReadCursors)
    .values({ roomId, userId, lastReadMessageId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [chatRoomReadCursors.roomId, chatRoomReadCursors.userId],
      set: { lastReadMessageId, updatedAt: new Date() },
    });
}

export async function getChatRoomReadCursorsDb(
  db: PgFeaturesDb,
  roomId: string,
): Promise<{ userId: string; lastReadMessageId: string | null; updatedAt: Date | null }[]> {
  return db.select().from(chatRoomReadCursors).where(eq(chatRoomReadCursors.roomId, roomId));
}

export async function getChatMessageReadersDb(
  db: PgFeaturesDb,
  roomId: string,
  messageId: string,
  excludeUserId?: string,
): Promise<User[]> {
  const [msg] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  if (!msg?.createdAt) return [];

  const cursors = await getChatRoomReadCursorsDb(db, roomId);
  const readerIds: string[] = [];
  for (const cursor of cursors) {
    if (excludeUserId && cursor.userId === excludeUserId) continue;
    if (!cursor.lastReadMessageId) continue;
    const [readMsg] = await db
      .select({ createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(eq(chatMessages.id, cursor.lastReadMessageId))
      .limit(1);
    if (readMsg?.createdAt && new Date(readMsg.createdAt) >= new Date(msg.createdAt)) {
      readerIds.push(cursor.userId);
    }
  }
  if (readerIds.length === 0) return [];
  return db.select().from(users).where(inArray(users.id, readerIds));
}

export async function getChatMessageReadMetaDb(
  db: PgFeaturesDb,
  roomId: string,
  messageIds: string[],
  authorId: string,
): Promise<
  Record<string, { deliveryStatus: MessageDeliveryStatus; readByCount: number; memberCount: number }>
> {
  const out: Record<string, { deliveryStatus: MessageDeliveryStatus; readByCount: number; memberCount: number }> =
    {};
  if (messageIds.length === 0) return out;

  const members = await db
    .select({ userId: chatRoomMembers.userId })
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.status, "active")));
  const otherMemberIds = members.map((m) => m.userId).filter((id) => id !== authorId);
  const memberCount = otherMemberIds.length;

  const cursors = await getChatRoomReadCursorsDb(db, roomId);
  const cursorByUser = new Map(cursors.map((c) => [c.userId, c]));

  const readMsgIds = cursors.map((c) => c.lastReadMessageId).filter(Boolean) as string[];
  const readMsgTimes = new Map<string, Date>();
  if (readMsgIds.length > 0) {
    const readMsgs = await db
      .select({ id: chatMessages.id, createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(inArray(chatMessages.id, readMsgIds));
    for (const m of readMsgs) {
      if (m.createdAt) readMsgTimes.set(m.id, new Date(m.createdAt));
    }
  }

  const msgs = await db
    .select({ id: chatMessages.id, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(inArray(chatMessages.id, messageIds));

  for (const msg of msgs) {
    if (!msg.createdAt) {
      out[msg.id] = { deliveryStatus: "sent", readByCount: 0, memberCount };
      continue;
    }
    const msgTime = new Date(msg.createdAt);
    let readByCount = 0;
    let deliveredCount = 0;
    for (const memberId of otherMemberIds) {
      const cursor = cursorByUser.get(memberId);
      if (!cursor) continue;
      deliveredCount += 1;
      const readTime = cursor.lastReadMessageId ? readMsgTimes.get(cursor.lastReadMessageId) : undefined;
      if (readTime && readTime >= msgTime) readByCount += 1;
    }
    let deliveryStatus: MessageDeliveryStatus = "sent";
    if (memberCount === 0) {
      deliveryStatus = "delivered";
    } else if (readByCount === memberCount) {
      deliveryStatus = "read";
    } else if (deliveredCount === memberCount || readByCount > 0) {
      deliveryStatus = "delivered";
    }
    out[msg.id] = { deliveryStatus, readByCount, memberCount };
  }
  return out;
}

export async function markPrivateMessagesDeliveredDb(
  db: PgFeaturesDb,
  receiverId: string,
  senderId: string,
): Promise<void> {
  await db
    .update(privateMessages)
    .set({ deliveredAt: new Date() })
    .where(
      and(
        eq(privateMessages.receiverId, receiverId),
        eq(privateMessages.senderId, senderId),
        sql`${privateMessages.deliveredAt} IS NULL`,
      ),
    );
}

export function privateMessageDeliveryStatus(
  msg: PrivateMessage,
  viewerId: string,
): MessageDeliveryStatus {
  if (msg.senderId !== viewerId) return "sent";
  if (msg.isRead) return "read";
  if (msg.deliveredAt) return "delivered";
  return "sent";
}

export async function ensureLegacyChatRoomsDb(db: PgFeaturesDb): Promise<void> {
  for (const seed of LEGACY_CHAT_ROOM_SEEDS) {
    const [existing] = await db.select().from(chatRooms).where(eq(chatRooms.slug, seed.slug)).limit(1);
    if (existing) continue;
    await db.insert(chatRooms).values({
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      visibility: "public",
      isLegacy: true,
      settings: { autoJoinOnPost: true, whoCanPost: "everyone" },
    });
  }
}

export async function getPrivacySettingsDb(db: PgFeaturesDb, userId: string): Promise<UserPrivacySettings> {
  const [row] = await db.select().from(userPrivacySettings).where(eq(userPrivacySettings.userId, userId)).limit(1);
  if (row) return rowToPrivacySettings(row);
  const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const isPrivate = profile[0] ? !profile[0].isPublic : false;
  return {
    ...defaultPrivacyRow(userId),
    isPrivateAccount: isPrivate,
    showProfileTo: isPrivate ? "friends" : "everyone",
  };
}

export async function updatePrivacySettingsDb(
  db: PgFeaturesDb,
  userId: string,
  patch: Partial<Omit<UserPrivacySettings, "userId" | "createdAt" | "updatedAt">>,
): Promise<UserPrivacySettings> {
  const current = await getPrivacySettingsDb(db, userId);
  const merged = { ...current, ...patch };
  await db
    .insert(userPrivacySettings)
    .values({
      userId,
      isPrivateAccount: merged.isPrivateAccount,
      showOnlineStatus: merged.showOnlineStatus,
      showLastSeen: merged.showLastSeen,
      allowDmFrom: merged.allowDmFrom,
      allowFriendRequestsFrom: merged.allowFriendRequestsFrom,
      showProfileTo: merged.showProfileTo,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPrivacySettings.userId,
      set: {
        isPrivateAccount: merged.isPrivateAccount,
        showOnlineStatus: merged.showOnlineStatus,
        showLastSeen: merged.showLastSeen,
        allowDmFrom: merged.allowDmFrom,
        allowFriendRequestsFrom: merged.allowFriendRequestsFrom,
        showProfileTo: merged.showProfileTo,
        updatedAt: new Date(),
      },
    });
  if (patch.isPrivateAccount !== undefined) {
    const prof = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (prof[0]) {
      await db
        .update(userProfiles)
        .set({ isPublic: !merged.isPrivateAccount, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));
    }
  }
  return getPrivacySettingsDb(db, userId);
}

export async function touchPresenceDb(db: PgFeaturesDb, userId: string, isOnline: boolean): Promise<UserPresence> {
  const [row] = await db
    .insert(userPresence)
    .values({ userId, isOnline, lastSeenAt: new Date() })
    .onConflictDoUpdate({
      target: userPresence.userId,
      set: { isOnline, lastSeenAt: new Date() },
    })
    .returning();
  return row;
}

export async function getPresenceDb(db: PgFeaturesDb, userId: string): Promise<UserPresence | undefined> {
  const [row] = await db.select().from(userPresence).where(eq(userPresence.userId, userId)).limit(1);
  return row;
}

export async function areFriendsDb(db: PgFeaturesDb, userId1: string, userId2: string): Promise<boolean> {
  if (userId1 === userId2) return true;
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(
          and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
          and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1)),
        )!,
      )!,
    )
    .limit(1);
  return Boolean(row);
}

export async function searchUsersDb(
  db: PgFeaturesDb,
  query: string,
  limit = 10,
  options?: {
    viewerId?: string;
    exact?: boolean;
    direction?: string;
    travelStyle?: string;
  },
  areFriendsFn?: (a: string, b: string) => Promise<boolean>,
): Promise<User[]> {
  const term = query.trim().replace(/^@/, "");
  if (!term) return [];

  let rows: User[];
  if (options?.exact) {
    const [u] = await db.select().from(users).where(eq(users.username, term.toLowerCase())).limit(1);
    rows = u ? [u] : [];
  } else {
    const q = `%${term}%`;
    rows = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, q),
          ilike(users.displayName, q),
          ilike(users.firstName, q),
          ilike(users.lastName, q),
        )!,
      )
      .limit(limit * 3);
  }

  const filtered: User[] = [];
  for (const u of rows) {
    const settings = await getPrivacySettingsDb(db, u.id);
    if (settings.isPrivateAccount && options?.viewerId !== u.id) {
      const isFriend = options?.viewerId && areFriendsFn
        ? await areFriendsFn(options.viewerId, u.id)
        : false;
      const exactMatch = u.username?.toLowerCase() === term.toLowerCase();
      if (!isFriend && !exactMatch) continue;
    }
    if (options?.travelStyle || options?.direction) {
      const [prof] = await db.select().from(userProfiles).where(eq(userProfiles.userId, u.id)).limit(1);
      if (options.travelStyle && prof?.travelStyle !== options.travelStyle) continue;
      if (options.direction) {
        const dests = prof?.favoriteDestinations ?? [];
        const interests = prof?.interests ?? [];
        const hay = [...dests, ...interests, prof?.travelStyle ?? ""].join(" ").toLowerCase();
        if (!hay.includes(options.direction.replace("_", " ")) && prof?.travelStyle !== options.direction) {
          continue;
        }
      }
    }
    filtered.push(u);
    if (filtered.length >= limit) break;
  }
  return filtered;
}

export async function getChatRoomBySlugDb(db: PgFeaturesDb, slug: string): Promise<ChatRoom | undefined> {
  const [row] = await db.select().from(chatRooms).where(eq(chatRooms.slug, slug)).limit(1);
  return row;
}

export async function getChatRoomDb(db: PgFeaturesDb, id: string): Promise<ChatRoom | undefined> {
  const [row] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
  return row;
}

export async function listChatRoomsForUserDb(
  db: PgFeaturesDb,
  userId: string,
): Promise<(ChatRoom & { memberCount: number; myRole: string | null })[]> {
  const allRooms = await db.select().from(chatRooms).orderBy(desc(chatRooms.isLegacy), desc(chatRooms.createdAt));
  const result: (ChatRoom & { memberCount: number; myRole: string | null })[] = [];
  for (const room of allRooms) {
    const [{ value: memberCount }] = await db
      .select({ value: count() })
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, room.id), eq(chatRoomMembers.status, "active")));
    const [my] = await db
      .select()
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, room.id), eq(chatRoomMembers.userId, userId)))
      .limit(1);
    if (room.visibility === "private" && (!my || my.status !== "active")) continue;
    result.push({ ...room, memberCount: Number(memberCount), myRole: my?.role ?? null });
  }
  return result;
}

export async function createChatRoomDb(
  db: PgFeaturesDb,
  data: {
    slug?: string;
    title: string;
    description?: string;
    avatarUrl?: string;
    visibility: "public" | "private";
    createdBy: string;
    settings?: ChatRoom["settings"];
  },
): Promise<ChatRoom> {
  let slug = data.slug ?? slugify(data.title);
  let n = 0;
  while (await getChatRoomBySlugDb(db, slug)) {
    n += 1;
    slug = `${slugify(data.title)}-${n}`;
  }
  const [room] = await db
    .insert(chatRooms)
    .values({
      slug,
      title: data.title,
      description: data.description ?? null,
      avatarUrl: data.avatarUrl ?? null,
      visibility: data.visibility,
      createdBy: data.createdBy,
      settings: data.settings ?? { autoJoinOnPost: true, whoCanPost: "members" },
      isLegacy: false,
    })
    .returning();
  await db.insert(chatRoomMembers).values({
    roomId: room.id,
    userId: data.createdBy,
    role: "owner",
    status: "active",
  });
  return room;
}

export async function updateChatRoomDb(
  db: PgFeaturesDb,
  id: string,
  patch: Partial<Pick<ChatRoom, "title" | "description" | "avatarUrl" | "visibility" | "settings">>,
): Promise<ChatRoom> {
  let nextPatch = patch;
  if (patch.settings) {
    const [existing] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
    if (!existing) throw new Error("Room not found");
    nextPatch = {
      ...patch,
      settings: { ...(existing.settings ?? {}), ...patch.settings },
    };
  }
  const [row] = await db
    .update(chatRooms)
    .set({ ...nextPatch, updatedAt: new Date() })
    .where(eq(chatRooms.id, id))
    .returning();
  if (!row) throw new Error("Room not found");
  return row;
}

export async function getChatRoomMemberDb(
  db: PgFeaturesDb,
  roomId: string,
  userId: string,
): Promise<ChatRoomMember | undefined> {
  const [row] = await db
    .select()
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)))
    .limit(1);
  return row;
}

export async function joinChatRoomDb(
  db: PgFeaturesDb,
  roomId: string,
  userId: string,
  role = "member",
): Promise<ChatRoomMember> {
  const existing = await getChatRoomMemberDb(db, roomId, userId);
  if (existing) {
    if (existing.status === "banned") throw new Error("Banned");
    const [row] = await db
      .update(chatRoomMembers)
      .set({ status: "active" })
      .where(eq(chatRoomMembers.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(chatRoomMembers)
    .values({ roomId, userId, role, status: "active" })
    .returning();
  return row;
}

export async function leaveChatRoomDb(db: PgFeaturesDb, roomId: string, userId: string): Promise<void> {
  await db
    .delete(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)));
}

export async function getChatRoomMembersDb(
  db: PgFeaturesDb,
  roomId: string,
): Promise<(ChatRoomMember & { user: User })[]> {
  const members = await db
    .select()
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.status, "active")));
  const out: (ChatRoomMember & { user: User })[] = [];
  for (const m of members) {
    const [u] = await db.select().from(users).where(eq(users.id, m.userId)).limit(1);
    if (u) out.push({ ...m, user: u });
  }
  return out;
}

export async function setChatRoomMemberRoleDb(
  db: PgFeaturesDb,
  roomId: string,
  userId: string,
  role: string,
): Promise<ChatRoomMember> {
  const [row] = await db
    .update(chatRoomMembers)
    .set({ role })
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)))
    .returning();
  if (!row) throw new Error("Member not found");
  return row;
}

export async function banChatRoomMemberDb(db: PgFeaturesDb, roomId: string, userId: string): Promise<void> {
  await db
    .update(chatRoomMembers)
    .set({ status: "banned" })
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)));
}

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createChatRoomInviteDb(
  db: PgFeaturesDb,
  roomId: string,
  createdBy: string,
  opts?: { expiresAt?: Date; maxUses?: number },
): Promise<ChatRoomInvite & { inviteUrl: string }> {
  const token = randomToken();
  const [row] = await db
    .insert(chatRoomInvites)
    .values({
      roomId,
      token,
      createdBy,
      expiresAt: opts?.expiresAt ?? null,
      maxUses: opts?.maxUses ?? null,
    })
    .returning();
  return { ...row, inviteUrl: `/chat/join/${token}` };
}

export async function joinChatRoomByTokenDb(db: PgFeaturesDb, token: string, userId: string): Promise<ChatRoom> {
  const [invite] = await db.select().from(chatRoomInvites).where(eq(chatRoomInvites.token, token)).limit(1);
  if (!invite) throw new Error("Invalid invite");
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) throw new Error("Invite expired");
  if (invite.maxUses != null && (invite.useCount ?? 0) >= invite.maxUses) throw new Error("Invite exhausted");
  const room = await getChatRoomDb(db, invite.roomId);
  if (!room) throw new Error("Room not found");
  await joinChatRoomDb(db, room.id, userId);
  await db
    .update(chatRoomInvites)
    .set({ useCount: (invite.useCount ?? 0) + 1 })
    .where(eq(chatRoomInvites.id, invite.id));
  return room;
}

export async function pinChatMessageDb(
  db: PgFeaturesDb,
  roomId: string,
  messageId: string,
  pinnedBy: string,
): Promise<void> {
  await db
    .delete(chatPinnedMessages)
    .where(and(eq(chatPinnedMessages.roomId, roomId), eq(chatPinnedMessages.messageId, messageId)));
  await db.insert(chatPinnedMessages).values({ roomId, messageId, pinnedBy });
}

export async function unpinChatMessageDb(db: PgFeaturesDb, roomId: string, messageId: string): Promise<void> {
  await db
    .delete(chatPinnedMessages)
    .where(and(eq(chatPinnedMessages.roomId, roomId), eq(chatPinnedMessages.messageId, messageId)));
}

export async function getPinnedMessageIdsDb(db: PgFeaturesDb, roomId: string): Promise<string[]> {
  const rows = await db
    .select()
    .from(chatPinnedMessages)
    .where(eq(chatPinnedMessages.roomId, roomId));
  return rows.map((r) => r.messageId);
}

export async function deleteChatMessageDb(db: PgFeaturesDb, messageId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
}

export async function listUserTracksDb(db: PgFeaturesDb, userId: string): Promise<UserTrack[]> {
  return db
    .select()
    .from(userTracks)
    .where(eq(userTracks.userId, userId))
    .orderBy(desc(userTracks.createdAt));
}

export async function getUserTrackDb(db: PgFeaturesDb, id: string): Promise<UserTrack | undefined> {
  const [row] = await db.select().from(userTracks).where(eq(userTracks.id, id)).limit(1);
  return row;
}

export async function createUserTrackDb(db: PgFeaturesDb, data: InsertUserTrack): Promise<UserTrack> {
  const [row] = await db.insert(userTracks).values(data).returning();
  return row;
}

export async function deleteUserTrackDb(db: PgFeaturesDb, id: string): Promise<void> {
  await db.delete(userTracks).where(eq(userTracks.id, id));
}

export async function createAdminBroadcastDb(
  db: PgFeaturesDb,
  data: InsertAdminBroadcast,
): Promise<AdminBroadcast> {
  const [row] = await db.insert(adminBroadcasts).values(data).returning();
  return row;
}

export async function getAdminBroadcastsDb(db: PgFeaturesDb): Promise<AdminBroadcast[]> {
  return db.select().from(adminBroadcasts).orderBy(desc(adminBroadcasts.createdAt));
}

export async function getPendingAdminBroadcastDb(
  db: PgFeaturesDb,
  userId: string,
): Promise<AdminBroadcast | undefined> {
  const result = await db.execute(sql`
    SELECT b.id, b.created_by, b.content, b.is_active, b.expires_at, b.created_at
    FROM admin_broadcasts b
    WHERE b.is_active = true
      AND (b.expires_at IS NULL OR b.expires_at > now())
      AND NOT EXISTS (
        SELECT 1 FROM admin_broadcast_dismissals d
        WHERE d.broadcast_id = b.id AND d.user_id = ${userId}
      )
    ORDER BY b.created_at ASC
    LIMIT 1
  `);
  const rows = result.rows as Array<{
    id: string;
    created_by: string;
    content: string;
    is_active: boolean;
    expires_at: Date | null;
    created_at: Date | null;
  }>;
  const row = rows[0];
  if (!row) return undefined;
  return {
    id: row.id,
    createdBy: row.created_by,
    content: row.content,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function dismissAdminBroadcastDb(
  db: PgFeaturesDb,
  broadcastId: string,
  userId: string,
  action: string,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO admin_broadcast_dismissals (broadcast_id, user_id, action)
    VALUES (${broadcastId}, ${userId}, ${action})
    ON CONFLICT (broadcast_id, user_id) DO NOTHING
  `);
}

export async function getAllUserIdsDb(db: PgFeaturesDb): Promise<string[]> {
  const rows = await db.select({ id: users.id }).from(users);
  return rows.map((r) => r.id);
}
