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
} from "@shared/schema";
import {
  chatMessageLikes,
  chatMessages,
  chatPinnedMessages,
  chatRoomInvites,
  chatRoomMembers,
  chatRooms,
  friendships,
  privateMessageLikes,
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
}

export type MessageLikeMeta = { likeCount: number; likedByMe: boolean };

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
