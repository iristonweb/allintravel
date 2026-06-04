import { tryGrantSpend } from "./service";
import * as store from "./store";

export async function grantTripCinemaWatch(
  userId: string,
  tripId: string,
): Promise<Awaited<ReturnType<typeof tryGrantSpend>>> {
  if (await store.hasGrantForEntity(userId, "trip_cinema_watch", tripId)) {
    return null;
  }
  return tryGrantSpend(userId, "trip_cinema_watch", {
    entityType: "trip",
    entityId: tripId,
  });
}
