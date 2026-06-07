import type { ChatRoom } from "@shared/schema";
import type { IStorage } from "./storage";

export type ChatAccessResult =
  | { allowed: true; room: ChatRoom; canPost: boolean; isMember: boolean }
  | { allowed: false; reason: string; joinRequired?: boolean; room?: ChatRoom };

export async function resolveChatRoomAccess(
  storage: IStorage,
  roomSlug: string,
  userId: string | null,
): Promise<ChatAccessResult> {
  const normalized = roomSlug.trim().slice(0, 100);
  if (!normalized || normalized.includes("..")) {
    return { allowed: false, reason: "Invalid room" };
  }

  const room = await storage.getChatRoomBySlug(normalized);
  if (!room) return { allowed: false, reason: "Room not found" };

  if (!userId) {
    return { allowed: false, reason: "Authentication required" };
  }

  const member = await storage.getChatRoomMember(room.id, userId);
  const isMember = Boolean(member && member.status === "active");

  if (room.visibility === "private") {
    if (!isMember || member?.status === "banned") {
      return { allowed: false, reason: "Private room — invite required" };
    }
  } else if (member?.status === "banned") {
    return { allowed: false, reason: "Banned from room" };
  } else if (!room.isLegacy && !isMember) {
    return {
      allowed: false,
      reason: "Вступите в группу, чтобы читать сообщения",
      joinRequired: true,
      room,
    };
  }

  const settings = room.settings ?? {};
  const whoCanPost = settings.whoCanPost ?? "everyone";
  const isAdmin = member?.role === "admin" || member?.role === "owner";

  let canPost = false;
  if (whoCanPost === "everyone") {
    canPost = room.visibility === "public" && (room.isLegacy || isMember);
  } else {
    canPost = isMember;
  }
  if (isAdmin) canPost = true;

  return { allowed: true, room, canPost, isMember };
}

export async function ensureMemberForPost(
  storage: IStorage,
  room: ChatRoom,
  userId: string,
): Promise<void> {
  const member = await storage.getChatRoomMember(room.id, userId);
  if (member?.status === "active") return;

  if (room.visibility === "private") {
    throw new Error("Not a member");
  }

  if (!room.isLegacy) {
    throw new Error("Join the group before posting");
  }

  const autoJoin = room.settings?.autoJoinOnPost !== false;
  if (autoJoin) {
    await storage.joinChatRoom(room.id, userId, "member");
  }
}
