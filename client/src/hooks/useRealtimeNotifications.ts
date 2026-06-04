import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { AppNotification } from "@shared/notification-types";

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isVercelHost) return;

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
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/received"] });
          toast({
            title: data.notification.title,
            description: data.notification.body,
          });
        }
        if (data.type === "new_message") {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        }
        if (data.type === "broadcast_published") {
          queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/pending"] });
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
