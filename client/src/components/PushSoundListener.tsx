import { useEffect } from "react";
import { playNotificationSound } from "@/lib/notification-sound";

type SwMessage = {
  type?: string;
  soundKind?: "default" | "ait";
};

export default function PushSoundListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent<SwMessage>) => {
      if (event.data?.type === "PLAY_NOTIFICATION_SOUND") {
        playNotificationSound(event.data.soundKind ?? "default");
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return null;
}
