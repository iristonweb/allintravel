import { useEffect } from "react";
import { playNotificationSound } from "@/lib/notification-sound";
import { showAppNotificationToast } from "@/lib/app-notification-toast";

type SwMessage = {
  type?: string;
  soundKind?: "default" | "ait";
  title?: string;
  body?: string;
  url?: string;
};

export default function InAppNotificationListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent<SwMessage>) => {
      if (event.data?.type === "PLAY_NOTIFICATION_SOUND") {
        playNotificationSound(event.data.soundKind ?? "default");
        return;
      }
      if (event.data?.type === "SHOW_IN_APP_TOAST" && event.data.title) {
        showAppNotificationToast({
          title: event.data.title,
          body: event.data.body,
          url: event.data.url,
          soundKind: event.data.soundKind,
          playSound: false,
        });
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return null;
}
