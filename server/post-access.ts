import type { TravelPost } from "@shared/schema";

/** Whether the viewer may read or interact with this post. */
export function canViewPost(
  post: TravelPost | null | undefined,
  viewerId: string | null,
): post is TravelPost {
  if (!post) return false;
  if (post.isPublic) return true;
  return viewerId !== null && post.userId === viewerId;
}
