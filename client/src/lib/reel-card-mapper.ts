import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { isVideoUrl } from "@/lib/upload-media";
import type { ReelCardViewModel } from "@/components/feed/ReelCard";
import type { TravelPostWithAuthor } from "@shared/schema";
import type { ReactNode } from "react";

export function authorLinkForPost(post: TravelPostWithAuthor): string {
  return post.userId ? `/chat?with=${post.userId}&tab=personal` : "/profile";
}

export function mapPostToReelCard(
  post: TravelPostWithAuthor,
  options?: { authorAction?: ReactNode; travelerLabel?: string },
): ReelCardViewModel {
  const url = post.images?.find((u) => isVideoUrl(u)) ?? post.images?.[0];
  const src = url ? resolveMediaUrl(url) : null;
  const isVideo = url ? isVideoUrl(url) : false;
  const traveler = options?.travelerLabel ?? "Traveler";

  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || traveler
    : traveler;

  return {
    id: post.id,
    videoSrc: isVideo ? src : null,
    posterSrc: !isVideo ? src : null,
    isVideo,
    authorName,
    authorAvatar: post.author?.profileImageUrl,
    authorFallback: post.author?.firstName?.[0] || "?",
    authorAction: options?.authorAction,
    authorHref: authorLinkForPost(post),
    isPro: Boolean((post as { creatorBadge?: boolean }).creatorBadge),
    location: post.location ?? undefined,
    title: post.title ?? undefined,
    description: post.content ?? undefined,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    isLiked: post.isLiked,
  };
}
