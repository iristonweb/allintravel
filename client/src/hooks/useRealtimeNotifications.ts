import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { AppNotification } from "@shared/notification-types";
import { playNotificationSound } from "@/lib/notification-sound";

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

const POLL_MS = 8000;

export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const invalidateNotifs = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    };

    if (isVercelHost) {
      invalidateNotifs();
      const pollId = window.setInterval(invalidateNotifs, POLL_MS);
      const onVisible = () => {
        if (document.visibilityState === "visible") invalidateNotifs();
      };
      const onFocus = () => invalidateNotifs();
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onFocus);
      return () => {
        window.clearInterval(pollId);
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onFocus);
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
