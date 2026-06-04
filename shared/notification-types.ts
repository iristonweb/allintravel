export const NOTIFICATION_TYPES = [
  "friend_request",
  "friend_accepted",
  "friend_rejected",
  "message",
  "trip_join",
  "event_registration",
  "group_invite",
  "group_join",
  "request_accepted",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  actorId: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string | null;
};

export type NotificationsSummary = {
  totalUnread: number;
  friendRequests: number;
  unreadMessages: number;
  items: AppNotification[];
};
