import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { usePushNotifications } from "./usePushNotifications";
import type { AppNotification } from "@shared/notification-types";
import {
  showAppNotificationToast,
  truncateNotificationPreview,
} from "@/lib/app-notification-toast";
import i18n from "@/i18n";
import type { User } from "@shared/schema";

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

const POLL_VISIBLE_MS = 4000;
const POLL_VISIBLE_PUSH_MS = 30000;
const POLL_HIDDEN_MS = 15000;
const POLL_HIDDEN_PUSH_MS = 60000;

type NotificationsPayload = {
  items?: AppNotification[];
  unreadNotifications?: number;
};

type SwNotificationMessage = {
  type?: string;
  notificationId?: string;
};

type ChatMessagePayload = {
  content?: string;
  senderId?: string;
  chatRoom?: string;
};

type WsPayload = {
  type?: string;
  notification?: AppNotification;
  message?: ChatMessagePayload | Record<string, unknown>;
  sender?: Pick<User, "id" | "firstName" | "lastName"> | null;
  partnerId?: string;
  messageId?: string;
  reactions?: unknown;
};

async function fetchNotificationsSnapshot(): Promise<NotificationsPayload> {
  const res = await fetch("/api/notifications?limit=15", { credentials: "include" });
  if (!res.ok) return {};
  return res.json() as Promise<NotificationsPayload>;
}

function senderLabel(sender?: Pick<User, "firstName" | "lastName"> | null): string {
  if (!sender) return i18n.t("notifications.someone");
  const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim();
  return name || i18n.t("notifications.someone");
}

function isViewingPrivateChat(partnerId: string): boolean {
  if (!window.location.pathname.startsWith("/chat")) return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") === "personal" && params.get("with") === partnerId;
}

function isViewingGroupChat(room: string): boolean {
  if (!window.location.pathname.startsWith("/chat")) return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("room") === room;
}

function showPrivateMessageToast(partnerId: string, message: ChatMessagePayload) {
  if (isViewingPrivateChat(partnerId)) return;
  const preview = message.content ? truncateNotificationPreview(message.content) : undefined;
  showAppNotificationToast({
    title: i18n.t("notifications.newPrivateMessage"),
    body: preview,
    url: `/chat?with=${encodeURIComponent(partnerId)}&tab=personal`,
  });
}

function showGroupMessageToast(
  message: ChatMessagePayload,
  sender?: Pick<User, "firstName" | "lastName"> | null,
) {
  const room = message.chatRoom;
  if (room && isViewingGroupChat(room)) return;
  const name = senderLabel(sender);
  const preview = message.content ? truncateNotificationPreview(message.content) : undefined;
  const url = room ? `/chat?room=${encodeURIComponent(room)}` : "/chat";
  showAppNotificationToast({
    title: i18n.t("notifications.newChatMessageFrom", { name }),
    body: preview,
    url,
  });
}

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useAuth();
  const { subscribed: pushSubscribed, vapidReady } = usePushNotifications();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    if (!isAuthenticated) return;

    const pushActive = pushSubscribed && vapidReady;

    const invalidateNotifs = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    };

    const markSeen = (id: string) => {
      seenIdsRef.current.add(id);
    };

    const pollAndNotify = async () => {
      try {
        const data = await fetchNotificationsSnapshot();
        if (!data.items) return;
        invalidateNotifs();
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });

        const items = data.items ?? [];
        const unread = items.filter((n) => !n.isRead);

        if (!primedRef.current) {
          for (const n of unread) seenIdsRef.current.add(n.id);
          primedRef.current = true;
          return;
        }

        for (const n of unread) {
          if (seenIdsRef.current.has(n.id)) continue;
          seenIdsRef.current.add(n.id);
          showAppNotificationToast({
            title: n.title,
            body: n.body,
            url: n.link ?? undefined,
          });
        }
      } catch {
        /* ignore poll errors */
      }
    };

    const onSwMessage = (event: MessageEvent<SwNotificationMessage>) => {
      if (event.data?.type === "PUSH_NOTIFICATION_SHOWN" && event.data.notificationId) {
        markSeen(event.data.notificationId);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }

    if (isVercelHost) {
      void pollAndNotify();
      const visibleMs = pushActive ? POLL_VISIBLE_PUSH_MS : POLL_VISIBLE_MS;
      const hiddenMs = pushActive ? POLL_HIDDEN_PUSH_MS : POLL_HIDDEN_MS;
      let pollId = window.setInterval(
        pollAndNotify,
        document.visibilityState === "visible" ? visibleMs : hiddenMs,
      );

      const resetPoll = () => {
        window.clearInterval(pollId);
        const ms = document.visibilityState === "visible" ? visibleMs : hiddenMs;
        pollId = window.setInterval(pollAndNotify, ms);
      };

      const onVisible = () => {
        if (document.visibilityState === "visible") void pollAndNotify();
        resetPoll();
      };

      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", () => void pollAndNotify());

      return () => {
        window.clearInterval(pollId);
        document.removeEventListener("visibilitychange", onVisible);
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.removeEventListener("message", onSwMessage);
        }
      };
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsPayload;
        if (data.type === "notification" && data.notification) {
          invalidateNotifs();
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/received"] });
          if (data.notification.type === "message") {
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          }
          showAppNotificationToast({
            title: data.notification.title,
            body: data.notification.body,
            url: data.notification.link ?? undefined,
          });
        }
        if (data.type === "new_private_message" && data.message && data.partnerId) {
          invalidateNotifs();
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          const currentUserId = userIdRef.current;
          if (data.message.senderId && data.message.senderId !== currentUserId) {
            showPrivateMessageToast(data.partnerId, data.message);
          }
        }
        if (data.type === "new_message" && data.message) {
          invalidateNotifs();
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          const currentUserId = userIdRef.current;
          if (data.message.senderId && data.message.senderId !== currentUserId) {
            showGroupMessageToast(data.message, data.sender);
          }
        }
        if (data.type === "broadcast_published") {
          showAppNotificationToast({
            title: i18n.t("notifications.broadcastPublished"),
            url: "/",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/pending"] });
        }
        if (data.type === "ait_grant") {
          showAppNotificationToast({
            title: i18n.t("notifications.aitGrant"),
            soundKind: "ait",
          });
        }
        if (data.type === "reaction_updated" && data.messageId) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        }
        if (data.type === "private_message_edited" && data.message) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }
        if (data.type === "private_message_deleted" && data.messageId) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
  }, [isAuthenticated, queryClient, pushSubscribed, vapidReady]);
}
