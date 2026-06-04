import type { AitGrantResult } from "./service";
import { tryGrantSpend } from "./service";
import * as store from "./store";

export async function grantTripCheckin(
  userId: string,
  tripId: string,
): Promise<AitGrantResult | null> {
  const date = store.todayUtc();
  const entityId = `${tripId}:${date}`;
  if (await store.hasGrantForEntity(userId, "trip_checkin", entityId)) {
    return null;
  }
  return tryGrantSpend(userId, "trip_checkin", {
    entityType: "trip",
    entityId,
  });
}
