import type { TravelPostWithAuthor } from "@shared/schema";

export type FeedMode = "all" | "following" | "popular";

export const FEED_MODE_LABELS: Record<FeedMode, string> = {
  all: "Лента",
  following: "Подписки",
  popular: "Популярное",
};

export function feedModeFromQuery(value: string | null): FeedMode {
  if (value === "following" || value === "popular") return value;
  return "all";
}

export function feedModeToQuery(mode: FeedMode): string {
  if (mode === "all") return "";
  return `?mode=${mode}`;
}

export function sortPostsByPopularity(posts: TravelPostWithAuthor[]): TravelPostWithAuthor[] {
  return [...posts].sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
}

export function filterPostsForFeedMode(
  posts: TravelPostWithAuthor[],
  mode: FeedMode,
): TravelPostWithAuthor[] {
  if (mode === "popular") return sortPostsByPopularity(posts);
  return posts;
}
