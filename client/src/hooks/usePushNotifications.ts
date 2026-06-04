import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [vapidReady, setVapidReady] = useState(false);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
    fetch("/api/push/vapid-public-key", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { publicKey?: string | null; enabled?: boolean }) => {
        setVapidReady(Boolean(d.publicKey && d.enabled !== false));
      })
      .catch(() => setVapidReady(false));
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || !vapidReady || !isAuthenticated) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;
    const keyRes = await fetch("/api/push/vapid-public-key", { credentials: "include" });
    const { publicKey } = (await keyRes.json()) as { publicKey: string };
    if (!publicKey) return false;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = sub.toJSON();
    await apiRequest("POST", "/api/push/subscribe", {
      endpoint: json.endpoint,
      keys: json.keys,
    });

    setSubscribed(true);
    return true;
  }, [supported, vapidReady, isAuthenticated]);

  const testPush = useCallback(async () => {
    await apiRequest("POST", "/api/push/test");
  }, []);

  return { supported, subscribed, vapidReady, subscribe, testPush };
}
