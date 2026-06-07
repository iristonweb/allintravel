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
  "message_pinned",
  "post_like",
  "post_comment",
  "message_reaction",
  "chat_reaction",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_FILTERS = ["all", "social", "messages"] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

export const SOCIAL_NOTIFICATION_TYPES: NotificationType[] = [
  "post_like",
  "post_comment",
  "friend_request",
  "friend_accepted",
  "friend_rejected",
  "trip_join",
  "event_registration",
  "group_invite",
  "group_join",
  "request_accepted",
];

export const MESSAGE_NOTIFICATION_TYPES: NotificationType[] = [
  "message",
  "message_reaction",
  "chat_reaction",
  "message_pinned",
];

export type NotificationActor = {
  id: string;
  displayName?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

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
  actor?: NotificationActor | null;
  /** Same entity grouped (e.g. 4 likes on one post). */
  aggregateCount?: number;
  aggregateIds?: string[];
  /** Up to 3 actors for stacked avatars (newest first). */
  actors?: NotificationActor[];
};

export type NotificationsSummary = {
  totalUnread: number;
  friendRequests: number;
  unreadMessages: number;
  unreadNotifications: number;
  items: AppNotification[];
  nextCursor: string | null;
};
