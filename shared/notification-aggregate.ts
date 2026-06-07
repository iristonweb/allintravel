import type { AppNotification, NotificationType } from "./notification-types";

/** Types grouped by entity (e.g. multiple likes on one post). */
export const AGGREGATABLE_NOTIFICATION_TYPES: NotificationType[] = ["post_like"];

function aggregateKey(item: Pick<AppNotification, "type" | "entityId">): string | null {
  if (!item.entityId) return null;
  if (!(AGGREGATABLE_NOTIFICATION_TYPES as readonly string[]).includes(item.type)) return null;
  return `${item.type}:${item.entityId}`;
}

/** Collapse same-type + same-entity rows into one item (newest actor first). */
export function aggregateNotifications(items: AppNotification[]): AppNotification[] {
  const result: AppNotification[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of items) {
    const key = aggregateKey(item);
    if (!key) {
      result.push(item);
      continue;
    }

    const existingIdx = indexByKey.get(key);
    if (existingIdx === undefined) {
      indexByKey.set(key, result.length);
      result.push({
        ...item,
        aggregateCount: 1,
        aggregateIds: [item.id],
        actors: item.actor ? [item.actor] : [],
      });
      continue;
    }

    const agg = result[existingIdx]!;
    const count = (agg.aggregateCount ?? 1) + 1;
    const ids = [...(agg.aggregateIds ?? [agg.id]), item.id];
    const actors = [...(agg.actors ?? (agg.actor ? [agg.actor] : []))];

    if (item.actor && actors.length < 3 && !actors.some((a) => a.id === item.actor!.id)) {
      actors.push(item.actor);
    }

    result[existingIdx] = {
      ...agg,
      aggregateCount: count,
      aggregateIds: ids,
      actors,
      isRead: agg.isRead && item.isRead,
    };
  }

  return result;
}
