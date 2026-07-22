export type NotificationLocale = "en" | "ru";

export function normalizeNotificationLocale(raw?: string | null): NotificationLocale {
  return raw?.startsWith("en") ? "en" : "ru";
}
