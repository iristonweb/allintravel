import type { NotificationType } from "@shared/notification-types";
import { formatPostLikeNotificationBody } from "@shared/notification-text";
import type { IStorage } from "./storage";
import { sendPushToUser } from "./push";
import { broadcastToUser } from "./realtime-hub";
import { getUserDisplayLabel } from "@shared/user-display";
import type { NotificationRow, User } from "@shared/schema";

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

function rowToPayload(row: NotificationRow) {
  return {
    type: "notification" as const,
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
}

async function emitNotificationRow(
  userId: string,
  row: NotificationRow,
  push: { title: string; body: string; url?: string; tag?: string },
): Promise<void> {
  broadcastToUser(userId, rowToPayload(row));
  await sendPushToUser(userId, {
    title: push.title,
    body: push.body,
    url: push.url ?? row.link ?? "/",
    tag: push.tag ?? `${row.type}-${row.entityId ?? row.id}`,
    soundKind: "default",
  });
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

  await emitNotificationRow(input.userId, row, {
    title: input.title,
    body: input.body,
    url: input.link,
    tag: `${input.type}-${input.entityId ?? row.id}`,
  });
}

export async function labelForUser(
  user: User | undefined,
  fallback = "Пользователь",
): Promise<string> {
  if (!user) return fallback;
  return getUserDisplayLabel(user);
}

export function truncateNotificationPreview(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

async function buildPostLikeNotification(
  postId: string,
  postContent: string,
  latestLiker: User,
): Promise<{ title: string; body: string; link: string }> {
  if (!storageRef) {
    const name = getUserDisplayLabel(latestLiker);
    return {
      title: "Оценка публикации",
      body: `${name} оценила вашу публикацию`,
      link: `/social-feed?post=${postId}`,
    };
  }

  const [likeCount, likerIds] = await Promise.all([
    storageRef.getPostLikesCount(postId),
    storageRef.getRecentPostLikerUserIds(postId, 3),
  ]);
  const likers = (await Promise.all(likerIds.map((id) => storageRef!.getUser(id)))).filter(
    Boolean,
  ) as User[];

  const actors = likers.length > 0 ? likers : [latestLiker];
  const body = formatPostLikeNotificationBody(actors, likeCount, postContent);

  return {
    title: "Оценка публикации",
    body,
    link: `/social-feed?post=${postId}`,
  };
}

export async function notifyPostLiked(
  postOwnerId: string,
  liker: User,
  postId: string,
  postContent: string,
): Promise<void> {
  if (!storageRef || postOwnerId === liker.id) return;

  const { title, body, link } = await buildPostLikeNotification(postId, postContent, liker);
  const existing = await storageRef.findNotificationByEntity(postOwnerId, "post_like", postId);

  let row: NotificationRow | undefined;
  if (existing) {
    row = await storageRef.updateNotification(postOwnerId, existing.id, {
      title,
      body,
      link,
      actorId: liker.id,
      isRead: false,
      bumpCreatedAt: true,
    });
    await storageRef.deleteDuplicateNotificationsForEntity(
      postOwnerId,
      "post_like",
      postId,
      existing.id,
    );
  } else {
    row = await storageRef.createNotification({
      userId: postOwnerId,
      type: "post_like",
      title,
      body,
      link,
      actorId: liker.id,
      entityId: postId,
    });
  }

  if (!row) return;

  await emitNotificationRow(postOwnerId, row, {
    title,
    body,
    url: link,
    tag: `post_like-${postId}`,
  });
}

/** Refresh or remove post_like notification after unlike. */
export async function syncPostLikeNotification(
  postOwnerId: string,
  postId: string,
  postContent: string,
): Promise<void> {
  if (!storageRef) return;

  const likeCount = await storageRef.getPostLikesCount(postId);
  if (likeCount === 0) {
    await storageRef.deleteNotificationsForEntity(postOwnerId, "post_like", postId);
    return;
  }

  const likerIds = await storageRef.getRecentPostLikerUserIds(postId, 1);
  const latest = likerIds[0] ? await storageRef.getUser(likerIds[0]) : undefined;
  if (!latest) return;

  const { title, body, link } = await buildPostLikeNotification(postId, postContent, latest);
  const existing = await storageRef.findNotificationByEntity(postOwnerId, "post_like", postId);
  if (existing) {
    await storageRef.updateNotification(postOwnerId, existing.id, {
      title,
      body,
      link,
      actorId: latest.id,
    });
    await storageRef.deleteDuplicateNotificationsForEntity(
      postOwnerId,
      "post_like",
      postId,
      existing.id,
    );
  }
}

export async function notifyPostCommented(
  postOwnerId: string,
  commenter: User,
  postId: string,
  postContent: string,
  commentText: string,
): Promise<void> {
  if (postOwnerId === commenter.id) return;
  const name = getUserDisplayLabel(commenter);
  const comment = truncateNotificationPreview(commentText, 120);
  const preview = truncateNotificationPreview(postContent, 40);
  await notifyUser({
    userId: postOwnerId,
    type: "post_comment",
    title: "Комментарий к публикации",
    body: preview
      ? `${name} прокомментировала «${preview}»: «${comment}»`
      : `${name} прокомментировала вашу публикацию: «${comment}»`,
    link: `/social-feed?post=${postId}`,
    actorId: commenter.id,
    entityId: postId,
  });
}

export async function notifyPrivateMessageReaction(
  messageAuthorId: string,
  reactor: User,
  messageId: string,
  partnerId: string,
  emoji: string,
  messagePreview: string,
): Promise<void> {
  if (messageAuthorId === reactor.id) return;
  const name = getUserDisplayLabel(reactor);
  const preview = truncateNotificationPreview(messagePreview);
  await notifyUser({
    userId: messageAuthorId,
    type: "message_reaction",
    title: "Реакция на сообщение",
    body: preview
      ? `${name} отреагировал(а) ${emoji} на «${preview}»`
      : `${name} отреагировал(а) ${emoji} на ваше сообщение`,
    link: `/messages?with=${partnerId}`,
    actorId: reactor.id,
    entityId: messageId,
  });
}

export async function notifyChatMessageReaction(
  messageAuthorId: string,
  reactor: User,
  messageId: string,
  roomSlug: string,
  roomTitle: string,
  emoji: string,
  messagePreview: string,
): Promise<void> {
  if (messageAuthorId === reactor.id) return;
  const name = getUserDisplayLabel(reactor);
  const preview = truncateNotificationPreview(messagePreview);
  await notifyUser({
    userId: messageAuthorId,
    type: "chat_reaction",
    title: `Реакция в «${roomTitle}»`,
    body: preview
      ? `${name} отреагировал(а) ${emoji}: «${preview}»`
      : `${name} отреагировал(а) ${emoji} на ваше сообщение`,
    link: `/chat?room=${encodeURIComponent(roomSlug)}`,
    actorId: reactor.id,
    entityId: messageId,
  });
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
  const link = chatSlug ? `/chat?room=${encodeURIComponent(chatSlug)}` : `/trips/${tripId}`;
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
