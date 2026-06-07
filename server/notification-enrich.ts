import type { AppNotification } from "@shared/notification-types";
import type { IStorage } from "./storage";
import type { User } from "@shared/schema";

type PublicUser = Pick<
  User,
  "id" | "displayName" | "username" | "profileImageUrl" | "firstName" | "lastName"
>;

function toActor(u: PublicUser) {
  return {
    id: u.id,
    displayName: u.displayName,
    username: u.username,
    profileImageUrl: u.profileImageUrl,
    firstName: u.firstName,
    lastName: u.lastName,
  };
}

/** Enrich post_like rows with live like count + recent likers from post_likes. */
export async function enrichPostLikeNotifications(
  items: AppNotification[],
  storage: IStorage,
  actorMap: Map<string, PublicUser>,
): Promise<AppNotification[]> {
  const postIds = Array.from(
    new Set(
      items.filter((n) => n.type === "post_like" && n.entityId).map((n) => n.entityId as string),
    ),
  );
  if (postIds.length === 0) return items;

  const stats = await Promise.all(
    postIds.map(async (postId) => {
      const [count, likerIds] = await Promise.all([
        storage.getPostLikesCount(postId),
        storage.getRecentPostLikerUserIds(postId, 3),
      ]);
      return { postId, count, likerIds };
    }),
  );
  const statsByPost = new Map(stats.map((s) => [s.postId, s]));

  const missingActorIds = new Set<string>();
  for (const s of stats) {
    for (const id of s.likerIds) {
      if (!actorMap.has(id)) missingActorIds.add(id);
    }
  }
  if (missingActorIds.size > 0) {
    const users = await Promise.all(Array.from(missingActorIds).map((id) => storage.getUser(id)));
    for (const u of users) {
      if (u) actorMap.set(u.id, u);
    }
  }

  return items.flatMap((item) => {
    if (item.type !== "post_like" || !item.entityId) return [item];
    const stat = statsByPost.get(item.entityId);
    if (!stat || stat.count === 0) return [];

    const actors = stat.likerIds
      .map((id) => actorMap.get(id))
      .filter(Boolean)
      .map((u) => toActor(u!));

    const primary = actors[0] ?? item.actor;
    return [
      {
        ...item,
        aggregateCount: stat.count,
        aggregateIds: item.aggregateIds ?? [item.id],
        actors,
        actor: primary ?? item.actor,
        actorId: primary?.id ?? item.actorId,
      },
    ];
  });
}
