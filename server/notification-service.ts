import type { NotificationType } from "@shared/notification-types";
import type { IStorage } from "./storage";
import { sendPushToUser } from "./push";
import { broadcastToUser } from "./realtime-hub";
import { getUserDisplayLabel } from "@shared/user-display";
import type { User } from "@shared/schema";

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  actorId?: string;
  entityId?: string;
};

let storageRef: IStorage | null = null;

export function setNotificationStorage(storage: IStorage): void {
  storageRef = storage;
}

export async function notifyUser(input: NotifyInput): Promise<void> {
  if (!storageRef) return;

  const row = await storageRef.createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    actorId: input.actorId ?? null,
    entityId: input.entityId ?? null,
  });

  const payload = {
    type: "notification",
    notification: {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      link: row.link,
      actorId: row.actorId,
      entityId: row.entityId,
      isRead: row.isRead,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    },
  };

  broadcastToUser(input.userId, payload);

  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    url: input.link ?? "/",
    tag: `${input.type}-${input.entityId ?? row.id}`,
    soundKind: "default",
  });
}

export async function labelForUser(user: User | undefined, fallback = "Пользователь"): Promise<string> {
  if (!user) return fallback;
  return getUserDisplayLabel(user);
}

export async function notifyFriendRequest(
  storage: IStorage,
  addresseeId: string,
  requester: User,
  friendshipId: string,
): Promise<void> {
  const name = getUserDisplayLabel(requester);
  await notifyUser({
    userId: addresseeId,
    type: "friend_request",
    title: "Заявка в друзья",
    body: `${name} хочет добавить вас в друзья`,
    link: "/profile/friends",
    actorId: requester.id,
    entityId: friendshipId,
  });
}

export async function notifyFriendAccepted(
  storage: IStorage,
  requesterId: string,
  accepter: User,
  friendshipId: string,
): Promise<void> {
  const name = getUserDisplayLabel(accepter);
  await notifyUser({
    userId: requesterId,
    type: "friend_accepted",
    title: "Заявка принята",
    body: `${name} принял(а) вашу заявку в друзья`,
    link: "/profile/friends",
    actorId: accepter.id,
    entityId: friendshipId,
  });
}

export async function notifyNewMessage(
  receiverId: string,
  sender: User,
  preview: string,
): Promise<void> {
  const name = getUserDisplayLabel(sender);
  const body = preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;
  await notifyUser({
    userId: receiverId,
    type: "message",
    title: `Сообщение от ${name}`,
    body,
    link: `/messages?with=${sender.id}`,
    actorId: sender.id,
    entityId: sender.id,
  });
}

export async function notifyTripJoin(
  ownerId: string,
  joiner: User,
  tripId: string,
  tripTitle: string,
): Promise<void> {
  if (ownerId === joiner.id) return;
  const name = getUserDisplayLabel(joiner);
  await notifyUser({
    userId: ownerId,
    type: "trip_join",
    title: "Новый участник поездки",
    body: `${name} присоединился к «${tripTitle}»`,
    link: `/trips/${tripId}`,
    actorId: joiner.id,
    entityId: tripId,
  });
}

export async function notifyTripInvite(
  inviteeId: string,
  inviter: User,
  tripId: string,
  tripTitle: string,
  chatSlug?: string | null,
): Promise<void> {
  if (inviteeId === inviter.id) return;
  const name = getUserDisplayLabel(inviter);
  const link = chatSlug
    ? `/chat?room=${encodeURIComponent(chatSlug)}`
    : `/trips/${tripId}`;
  await notifyUser({
    userId: inviteeId,
    type: "group_invite",
    title: "Приглашение в поездку",
    body: `${name} добавил(а) вас в «${tripTitle}» — открыт чат группы`,
    link,
    actorId: inviter.id,
    entityId: tripId,
  });
}

export async function notifyEventRegistration(
  organizerId: string | null | undefined,
  registrant: User,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  if (!organizerId || organizerId === registrant.id) return;
  const name = getUserDisplayLabel(registrant);
  await notifyUser({
    userId: organizerId,
    type: "event_registration",
    title: "Регистрация на событие",
    body: `${name} записался на «${eventTitle}»`,
    link: `/events`,
    actorId: registrant.id,
    entityId: eventId,
  });
}

export async function notifyGroupJoin(
  adminIds: string[],
  joiner: User,
  roomTitle: string,
  roomSlug: string,
): Promise<void> {
  const name = getUserDisplayLabel(joiner);
  for (const adminId of adminIds) {
    if (adminId === joiner.id) continue;
    await notifyUser({
      userId: adminId,
      type: "group_join",
      title: "Новый участник группы",
      body: `${name} вступил в «${roomTitle}»`,
      link: `/chat`,
      actorId: joiner.id,
      entityId: roomSlug,
    });
  }
}

export async function notifyChatMessagePinned(
  memberIds: string[],
  pinner: User,
  roomTitle: string,
  roomSlug: string,
  messageId: string,
  preview: string,
): Promise<void> {
  const name = getUserDisplayLabel(pinner);
  const body = preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;
  const link = `/chat?room=${encodeURIComponent(roomSlug)}&message=${messageId}`;
  for (const memberId of memberIds) {
    if (memberId === pinner.id) continue;
    await notifyUser({
      userId: memberId,
      type: "message_pinned",
      title: `Закреплено в «${roomTitle}»`,
      body: `${name}: ${body}`,
      link,
      actorId: pinner.id,
      entityId: messageId,
    });
  }
}
