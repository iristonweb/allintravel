import type { AppNotification, NotificationActor } from "@shared/notification-types";
import { getUserDisplayLabel } from "@shared/user-display";
import { apiRequest } from "@/lib/queryClient";

export async function markNotificationRead(item: AppNotification): Promise<void> {
  const ids = item.aggregateIds?.length ? item.aggregateIds : [item.id];
  if (ids.length === 1) {
    await apiRequest("PUT", `/api/notifications/${ids[0]}/read`);
    return;
  }
  await apiRequest("PUT", "/api/notifications/read-batch", { ids });
}

export function formatAggregatedActorLabel(
  actors: NotificationActor[],
  totalCount: number,
): string {
  const names = actors.map((a) => getUserDisplayLabel(a));
  if (totalCount <= 1) return names[0] ?? "Кто-то";
  if (totalCount === 2) {
    if (names.length >= 2) return `${names[0]} и ${names[1]}`;
    if (names.length === 1) return `${names[0]} и ещё один`;
    return "Два пользователя";
  }
  const others = totalCount - 1;
  const first = names[0] ?? "Кто-то";
  return `${first} и ещё ${others}`;
}

export function aggregatedActionVerb(type: AppNotification["type"], count: number): string {
  const plural = count > 1;
  switch (type) {
    case "post_comment":
      return plural ? "прокомментировали публикацию" : "прокомментировала публикацию";
    case "post_like":
      return plural ? "оценили вашу публикацию" : "оценила вашу публикацию";
    default:
      return plural ? "отправили уведомление" : "отправил(а) уведомление";
  }
}
