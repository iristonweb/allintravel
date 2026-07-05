import { isVideoUrl } from "@/lib/upload-media";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { TravelPostWithAuthor } from "@shared/schema";

export type StoryGroup = {
  userId: string;
  label: string;
  avatarUrl?: string | null;
  posts: TravelPostWithAuthor[];
};

export function groupStories(posts: TravelPostWithAuthor[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const post of posts) {
    const uid = post.userId;
    const existing = map.get(uid);
    const label = post.author
      ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "User"
      : "User";
    if (existing) {
      existing.posts.push(post);
    } else {
      map.set(uid, {
        userId: uid,
        label,
        avatarUrl: post.author?.profileImageUrl,
        posts: [post],
      });
    }
  }
  return Array.from(map.values());
}

export function coverForStoryGroup(group: StoryGroup): string | null {
  const first = group.posts[0];
  const media = first?.images?.[0];
  if (media && !isVideoUrl(media)) return resolveMediaUrl(media) ?? null;
  return resolveMediaUrl(group.avatarUrl) ?? null;
}
