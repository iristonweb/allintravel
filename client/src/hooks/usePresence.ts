import { useEffect } from "react";
import { useAuth } from "./useAuth";

/** Heartbeat for online status (privacy-aware display on server). */
export function usePresenceHeartbeat() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const ping = () => {
      fetch("/api/presence/heartbeat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: true }),
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 45_000);
    const onHide = () => {
      fetch("/api/presence/heartbeat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: false }),
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", onHide);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", onHide);
      onHide();
    };
  }, [isAuthenticated]);
}
