import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { NotificationRow } from "@shared/schema";
import {
  MESSAGE_NOTIFICATION_TYPES,
  SOCIAL_NOTIFICATION_TYPES,
  type NotificationFilter,
} from "@shared/notification-types";
import { notifications, pushSubscriptions } from "@shared/schema";
import type { Db } from "./pg-storage-types";

export async function ensureNotificationSchema(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type varchar(40) NOT NULL,
      title varchar(200) NOT NULL,
      body text NOT NULL,
      link varchar(500),
      actor_id varchar REFERENCES users(id) ON DELETE SET NULL,
      entity_id varchar(100),
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS IDX_notifications_user ON notifications (user_id)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS IDX_notifications_user_unread ON notifications (user_id, is_read)`,
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint text NOT NULL UNIQUE,
      p256dh text NOT NULL,
      auth text NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS IDX_push_subscriptions_user ON push_subscriptions (user_id)`,
  );
}

export async function createNotificationDb(
  db: Db,
  data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string | null;
    actorId?: string | null;
    entityId?: string | null;
  },
): Promise<NotificationRow> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link ?? null,
      actorId: data.actorId ?? null,
      entityId: data.entityId ?? null,
      isRead: false,
    })
    .returning();
  return row;
}

export async function getNotificationsDb(
  db: Db,
  userId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const { items } = await getNotificationsPageDb(db, userId, { limit });
  return items;
}

export async function getNotificationsPageDb(
  db: Db,
  userId: string,
  opts: { limit?: number; cursor?: string | null; filter?: NotificationFilter } = {},
): Promise<{ items: NotificationRow[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 50);
  const conditions = [eq(notifications.userId, userId)];

  if (opts.filter === "social") {
    conditions.push(inArray(notifications.type, SOCIAL_NOTIFICATION_TYPES));
  } else if (opts.filter === "messages") {
    conditions.push(inArray(notifications.type, MESSAGE_NOTIFICATION_TYPES));
  }

  if (opts.cursor) {
    const cursorDate = new Date(opts.cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lt(notifications.createdAt, cursorDate));
    }
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last?.createdAt ? last.createdAt.toISOString() : null;

  return { items, nextCursor };
}

export async function getUnreadNotificationCountDb(db: Db, userId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(value);
}

export async function markNotificationReadDb(db: Db, userId: string, id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsReadDb(db: Db, userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function upsertPushSubscriptionDb(
  db: Db,
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function getPushSubscriptionsForUserDb(
  db: Db,
  userId: string,
): Promise<{ endpoint: string; p256dh: string; auth: string }[]> {
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return rows.map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
}

export async function deletePushSubscriptionDb(db: Db, endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
