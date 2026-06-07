import type { AppNotification } from "@shared/notification-types";
import { formatPostLikeActorsLabel } from "@shared/notification-text";
import { apiRequest } from "@/lib/queryClient";
import i18n from "@/i18n";

export async function markNotificationRead(item: AppNotification): Promise<void> {
  const ids = item.aggregateIds?.length ? item.aggregateIds : [item.id];
  if (ids.length === 1) {
    await apiRequest("PUT", `/api/notifications/${ids[0]}/read`);
    return;
  }
  await apiRequest("PUT", "/api/notifications/read-batch", { ids });
}

export function formatAggregatedActorLabel(
  actors: Parameters<typeof formatPostLikeActorsLabel>[0],
  totalCount: number,
): string {
  const label = formatPostLikeActorsLabel(actors, totalCount);
  if (label === "Кто-то") return i18n.t("notifications.someone");
  return label;
}

export function aggregatedActionVerb(type: AppNotification["type"], count: number): string {
  const plural = count > 1;
  switch (type) {
    case "post_comment":
      return plural
        ? i18n.t("notifications.postComment.verbPlural")
        : i18n.t("notifications.postComment.verbSingle");
    case "post_like":
      return plural
        ? i18n.t("notifications.postLike.verbPlural")
        : i18n.t("notifications.postLike.verbSingle");
    default:
      return plural
        ? i18n.t("notifications.defaultVerbPlural")
        : i18n.t("notifications.defaultVerbSingle");
  }
}
