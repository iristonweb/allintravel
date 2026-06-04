const STORAGE_KEY = "ait-notification-sound-enabled";

export const NOTIFICATION_SOUND_URL = "/sounds/notify-short.wav";
export const AIT_NOTIFICATION_SOUND_URL = "/sounds/notify-short.wav";

let audioCache: HTMLAudioElement | null = null;

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(STORAGE_KEY);
  return v !== "0";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

export function playNotificationSound(kind: "default" | "ait" = "default"): void {
  if (typeof window === "undefined" || !isNotificationSoundEnabled()) return;
  try {
    const src = kind === "ait" ? AIT_NOTIFICATION_SOUND_URL : NOTIFICATION_SOUND_URL;
    if (!audioCache || audioCache.src !== new URL(src, window.location.origin).href) {
      audioCache = new Audio(src);
      audioCache.volume = kind === "ait" ? 0.55 : 0.45;
    }
    audioCache.currentTime = 0;
    void audioCache.play().catch(() => undefined);
  } catch {
    /* ignore */
  }
}
