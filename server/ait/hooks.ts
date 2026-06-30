import type { AitGrantResult } from "./service";
import { tryGrantCreator, tryGrantSpend } from "./service";

export type { AitGrantResult };

/** Fire-and-forget — no toast */
export function voidAit(promise: Promise<unknown>): void {
  void promise.catch((err) => console.warn("[ait]", err));
}

export function grantSpend(
  userId: string,
  reason: Parameters<typeof tryGrantSpend>[1],
  opts?: Parameters<typeof tryGrantSpend>[2],
): Promise<AitGrantResult | null> {
  return tryGrantSpend(userId, reason, opts);
}

export function grantCreator(
  userId: string,
  reason: Parameters<typeof tryGrantCreator>[1],
  opts?: Parameters<typeof tryGrantCreator>[2],
): Promise<AitGrantResult | null> {
  return tryGrantCreator(userId, reason, opts);
}

export async function grantForPostCreated(
  userId: string,
  format: string,
  content: string,
  images?: string[] | null,
  postId?: string,
): Promise<AitGrantResult | null> {
  const hasMedia = Boolean(images?.length);
  let grant: AitGrantResult | null = null;
  if (format === "story") {
    grant = await tryGrantSpend(userId, "post_story", {
      entityType: "post",
      entityId: postId ?? null,
    });
  } else if (format === "reel") {
    grant = await tryGrantSpend(userId, "post_reel", {
      entityType: "post",
      entityId: postId ?? null,
    });
  } else if (format === "journal") {
    grant = await tryGrantSpend(userId, "post_journal", {
      entityType: "post",
      entityId: postId ?? null,
    });
  } else if (hasMedia) {
    grant = await tryGrantSpend(userId, "post_media", {
      entityType: "post",
      entityId: postId ?? null,
    });
  } else if (content.trim().length >= 40) {
    grant = await tryGrantSpend(userId, "post_text", {
      entityType: "post",
      entityId: postId ?? null,
    });
  }
  if (grant) {
    const { rewardReferralMilestone } = await import("./referral-milestones");
    void rewardReferralMilestone(userId, "first_post");
  }
  return grant;
}

export async function grantForPostLiked(
  likerId: string,
  authorId: string,
  postId: string,
): Promise<{ authorGrant: AitGrantResult | null }> {
  if (likerId === authorId) return { authorGrant: null };
  const { incrementRing } = await import("./store");
  await incrementRing(likerId, "echo");
  const authorGrant = await grantCreator(authorId, "like_received", {
    entityType: "post",
    entityId: postId,
  });
  return { authorGrant };
}

export async function grantForPostCommented(
  commenterId: string,
  authorId: string,
  postId: string,
  content: string,
): Promise<{ commenterGrant: AitGrantResult | null; authorGrant: AitGrantResult | null }> {
  let commenterGrant: AitGrantResult | null = null;
  let authorGrant: AitGrantResult | null = null;
  if (content.trim().length >= 20) {
    commenterGrant = await tryGrantSpend(commenterId, "comment", {
      entityType: "post",
      entityId: postId,
    });
    const { incrementRing } = await import("./store");
    await incrementRing(commenterId, "echo");
  }
  if (commenterId !== authorId) {
    authorGrant = await tryGrantCreator(authorId, "comment_received", {
      entityType: "post",
      entityId: postId,
    });
  }
  return { commenterGrant, authorGrant };
}

export async function grantForChatMessage(
  userId: string,
  content: string,
  room: string,
): Promise<AitGrantResult | null> {
  const trimmed = content.trim();
  const hasMedia = /\[media:/i.test(trimmed) || /!\[/.test(trimmed);
  if (hasMedia) {
    return tryGrantSpend(userId, "chat_message_media", { entityType: "chat_room", entityId: room });
  }
  if (trimmed.length >= 20) {
    return tryGrantSpend(userId, "chat_message", { entityType: "chat_room", entityId: room });
  }
  return null;
}

export async function grantForDmMessage(
  senderId: string,
  content: string,
  receiverId: string,
): Promise<AitGrantResult | null> {
  if (content.trim().length >= 15) {
    return tryGrantSpend(senderId, "dm_message", {
      entityType: "user",
      entityId: receiverId,
    });
  }
  return null;
}

export async function grantForFriendAccepted(
  userA: string,
  userB: string,
): Promise<AitGrantResult | null> {
  await tryGrantSpend(userB, "friend_accepted", {
    entityType: "user",
    entityId: userA,
    skipCap: true,
  });
  return tryGrantSpend(userA, "friend_accepted", {
    entityType: "user",
    entityId: userB,
    skipCap: true,
  });
}

export async function grantForFollow(
  followerId: string,
  followingId: string,
): Promise<AitGrantResult | null> {
  const grant = await tryGrantSpend(followerId, "follow", {
    entityType: "user",
    entityId: followingId,
  });
  const { incrementRing } = await import("./store");
  await incrementRing(followerId, "echo");
  return grant;
}

export async function tryProfileCompleteBonus(
  userId: string,
  user: {
    username?: string | null;
    firstName?: string | null;
    profileImageUrl?: string | null;
  },
): Promise<AitGrantResult | null> {
  const { isProfileBonusClaimed, markProfileBonusClaimed } = await import("./store");
  if (await isProfileBonusClaimed(userId)) return null;
  const ok =
    Boolean(user.username?.trim()) &&
    Boolean(user.firstName?.trim()) &&
    Boolean(user.profileImageUrl?.trim());
  if (!ok) return null;
  await markProfileBonusClaimed(userId);
  const grant = await tryGrantSpend(userId, "profile_complete", { skipCap: true });
  const { rewardReferralMilestone } = await import("./referral-milestones");
  void rewardReferralMilestone(userId, "profile_complete");
  void rewardReferralMilestone(userId, "email_verified");
  return grant;
}

/** @deprecated use grantForPostCreated */
export function onPostCreated(...args: Parameters<typeof grantForPostCreated>): void {
  voidAit(grantForPostCreated(...args));
}

export function onPostLiked(...args: Parameters<typeof grantForPostLiked>): void {
  voidAit(grantForPostLiked(...args));
}

export function onPostCommented(...args: Parameters<typeof grantForPostCommented>): void {
  voidAit(grantForPostCommented(...args));
}

export function onChatMessage(...args: Parameters<typeof grantForChatMessage>): void {
  voidAit(grantForChatMessage(...args));
}

export function onDmMessage(...args: Parameters<typeof grantForDmMessage>): void {
  voidAit(grantForDmMessage(...args));
}

export function onFriendAccepted(...args: Parameters<typeof grantForFriendAccepted>): void {
  voidAit(grantForFriendAccepted(...args));
}

export function onFollow(...args: Parameters<typeof grantForFollow>): void {
  voidAit(grantForFollow(...args));
}
