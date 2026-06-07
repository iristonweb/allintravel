import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { AppNotification } from "@shared/notification-types";
import { playNotificationSound } from "@/lib/notification-sound";

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

const POLL_VISIBLE_MS = 4000;
const POLL_HIDDEN_MS = 15000;

type NotificationsPayload = {
  items?: AppNotification[];
  unreadNotifications?: number;
};

async function fetchNotificationsSnapshot(): Promise<NotificationsPayload> {
  const res = await fetch("/api/notifications?limit=15", { credentials: "include" });
  if (!res.ok) return {};
  return res.json() as Promise<NotificationsPayload>;
}

export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const invalidateNotifs = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    };

    const pollAndNotify = async () => {
      try {
        const data = await fetchNotificationsSnapshot();
        invalidateNotifs();
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });

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
          playNotificationSound("default");
          toast({ title: n.title, description: n.body });
        }
      } catch {
        /* ignore poll errors */
      }
    };

    if (isVercelHost) {
      void pollAndNotify();
      let pollId = window.setInterval(pollAndNotify, POLL_VISIBLE_MS);

      const resetPoll = () => {
        window.clearInterval(pollId);
        const ms = document.visibilityState === "visible" ? POLL_VISIBLE_MS : POLL_HIDDEN_MS;
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
      };
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type?: string;
          notification?: AppNotification;
        };
        if (data.type === "notification" && data.notification) {
          invalidateNotifs();
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/received"] });
          playNotificationSound("default");
          toast({
            title: data.notification.title,
            description: data.notification.body,
          });
        }
        if (data.type === "new_message") {
          playNotificationSound("default");
          invalidateNotifs();
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        }
        if (data.type === "broadcast_published") {
          playNotificationSound("default");
          queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/pending"] });
        }
        if (data.type === "ait_grant") {
          playNotificationSound("ait");
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isAuthenticated, queryClient, toast]);
}
