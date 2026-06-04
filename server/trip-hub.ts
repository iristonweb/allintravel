import type { IStorage } from "./storage";
import type { Trip } from "@shared/schema";

export async function ensureTripChatRoom(storage: IStorage, trip: Trip): Promise<Trip> {
  if (trip.chatRoomId) return trip;
  const slug = `trip-${trip.id.slice(0, 8)}`;
  const room = await storage.createChatRoom({
    slug,
    title: `Поездка: ${trip.title}`,
    description: `Чат группы — ${trip.destination}`,
    visibility: "private",
    createdBy: trip.userId,
    settings: { tripId: trip.id, whoCanPost: "members", autoJoinOnPost: false },
  });
  const updated = await storage.updateTrip(trip.id, { chatRoomId: room.id });
  return updated ?? { ...trip, chatRoomId: room.id };
}
