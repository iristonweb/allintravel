import type { IStorage } from "./storage";
import type { Trip } from "@shared/schema";
import { notifyTripInvite } from "./notification-service";

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

export async function inviteUsersToTrip(
  storage: IStorage,
  trip: Trip,
  inviteUserIds: string[],
  inviterId: string,
): Promise<{ invited: string[]; skipped: string[] }> {
  const unique = Array.from(new Set(inviteUserIds)).filter((id) => id && id !== trip.userId);
  const invited: string[] = [];
  const skipped: string[] = [];

  let current = await storage.getTrip(trip.id);
  if (!current) return { invited, skipped };

  const inviter = await storage.getUser(inviterId);

  for (const userId of unique) {
    const max = current.maxParticipants ?? 50;
    if ((current.currentParticipants ?? 1) >= max) {
      skipped.push(userId);
      continue;
    }
    const already = await storage.isTripParticipant(current.id, userId);
    if (already) {
      skipped.push(userId);
      continue;
    }
    try {
      await storage.joinTrip(current.id, userId);
      invited.push(userId);
      if (inviter) {
        let chatSlug: string | null = null;
        if (current.chatRoomId) {
          const room = await storage.getChatRoom(current.chatRoomId);
          chatSlug = room?.slug ?? null;
        }
        void notifyTripInvite(userId, inviter, current.id, current.title, chatSlug);
      }
      current = (await storage.getTrip(current.id)) ?? current;
    } catch {
      skipped.push(userId);
    }
  }

  return { invited, skipped };
}
