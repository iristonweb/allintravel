import type { TravelPost } from "@shared/schema";
import "./policy/post-policies";
import { canViewPostViaPolicy } from "./policy/post-policies";

/** Whether the viewer may read or interact with this post. */
export function canViewPost(
  post: TravelPost | null | undefined,
  viewerId: string | null,
): post is TravelPost {
  return canViewPostViaPolicy(post, viewerId);
}
