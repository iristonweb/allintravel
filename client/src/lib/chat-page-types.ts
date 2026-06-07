import type { ChatMessage, ChatRoom, MessageReactionMeta, MessageReadMeta, PrivateMessage, User } from "@shared/schema";
import type { UserLabelFields } from "@shared/user-display";

export type ChatTab = "all" | "mine" | "unread" | "personal";

export type ReplyTarget = { username: string; label: string; preview: string };

export interface Conversation {
  user: User & { isOnline?: boolean };
  lastMessage: PrivateMessage | null;
  unreadCount: number;
}

export type RoomListItem = ChatRoom & { memberCount: number; myRole: string | null; unreadCount: number };

export type ChatMessageWithSender = ChatMessage &
  MessageReactionMeta &
  Partial<MessageReadMeta> & {
    sender?: (UserLabelFields & { id?: string; profileImageUrl?: string | null }) | null;
  };

export type DiscoverRoom = ChatRoom & { memberCount: number; matchScore: number };

export type ChatHistoryPayload = {
  messages?: ChatMessageWithSender[];
  pinnedMessageIds?: string[];
  room?: ChatRoom;
  joinRequired?: boolean;
  joinPreview?: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    avatarUrl?: string | null;
    memberCount?: number;
  };
};

export async function fetchChatHistory(room: string): Promise<ChatHistoryPayload> {
  const res = await fetch(`/api/chat/${encodeURIComponent(room)}`, { credentials: "include" });
  const body = (await res.json()) as Record<string, unknown>;
  if (res.status === 403 && body.joinRequired && body.room) {
    return {
      joinRequired: true,
      joinPreview: body.room as NonNullable<ChatHistoryPayload["joinPreview"]>,
      messages: [],
      pinnedMessageIds: [],
    };
  }
  if (!res.ok) throw new Error(String(body.message ?? "Failed to load chat"));
  return body as ChatHistoryPayload;
}
