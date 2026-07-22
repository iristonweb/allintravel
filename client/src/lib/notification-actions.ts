import type { AppNotification } from "@shared/notification-types";
import type { UserLabelFields } from "@shared/user-display";
import { getUserDisplayLabel } from "@shared/user-display";
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
  actors: UserLabelFields[],
  totalCount: number,
): string {
  if (totalCount <= 0 || actors.length === 0) return i18n.t("notifications.someone");

  const names = actors.map((a) => getUserDisplayLabel(a));

  if (totalCount <= 1) return names[0] ?? i18n.t("notifications.someone");

  if (totalCount === 2) {
    if (names.length >= 2) {
      return i18n.t("notifications.actors.two", { first: names[0], second: names[1] });
    }
    if (names.length === 1) {
      return i18n.t("notifications.actors.oneAndAnother", { name: names[0] });
    }
    return i18n.t("notifications.actors.twoUsers");
  }

  return i18n.t("notifications.actors.andMore", {
    name: names[0] ?? i18n.t("notifications.someone"),
    count: totalCount - 1,
  });
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
