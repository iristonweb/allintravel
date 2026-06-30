import type {
  ChatMessage,
  ChatRoom,
  MessageReactionMeta,
  MessageReadMeta,
  PrivateMessage,
  User,
} from "@shared/schema";
import type { UserLabelFields } from "@shared/user-display";
import { toApiUrl } from "@/lib/queryClient";

export type ChatTab = "all" | "mine" | "unread" | "personal";

export type ReplyTarget = { username: string; label: string; preview: string };

export interface Conversation {
  user: User & { isOnline?: boolean };
  lastMessage: PrivateMessage | null;
  unreadCount: number;
}

export type RoomListItem = ChatRoom & {
  memberCount: number;
  myRole: string | null;
  unreadCount: number;
  lastMessagePreview?: string | null;
};

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

export async function fetchChatHistory(
  room: string,
  since?: string | null,
): Promise<ChatHistoryPayload> {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  const qs = params.toString();
  const url = toApiUrl(`/api/chat/${encodeURIComponent(room)}${qs ? `?${qs}` : ""}`);
  const res = await fetch(url, { credentials: "include" });
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

export function chatHistoryErrorMessage(error: unknown, t: (key: string) => string): string {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (/unauthorized|401/i.test(msg)) return t("chat.page.errors.unauthorized");
  if (/private room|invite required|403/i.test(msg)) return t("chat.page.errors.privateRoom");
  if (/banned/i.test(msg)) return t("chat.page.errors.banned");
  if (/not found|404/i.test(msg)) return t("chat.page.errors.roomNotFound");
  return t("chat.page.errors.history");
}

/** Adaptive polling: faster when tab visible, slower when idle/hidden. */
export function chatPollIntervalMs(documentVisible: boolean, hasRecentActivity: boolean): number {
  if (!documentVisible) return 15_000;
  if (hasRecentActivity) return 4_000;
  return 8_000;
}
