import type { TravelPostWithAuthor } from "@shared/schema";

export type FeedMode = "all" | "following" | "popular" | "nearby";

/** Legacy labels — prefer t('feed.*') in UI */
export const FEED_MODE_LABELS: Record<FeedMode, string> = {
  all: "Feed",
  following: "Following",
  popular: "Popular",
  nearby: "Nearby",
};

export function feedModeFromQuery(value: string | null): FeedMode {
  if (value === "following" || value === "popular" || value === "nearby") return value;
  return "all";
}

export function feedModeToQuery(mode: FeedMode): string {
  if (mode === "all") return "";
  return `?mode=${mode}`;
}

export function sortPostsByPopularity(posts: TravelPostWithAuthor[]): TravelPostWithAuthor[] {
  return [...posts].sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function filterPostsForFeedMode(
  posts: TravelPostWithAuthor[],
  mode: FeedMode,
  options?: { userLat?: number | null; userLon?: number | null; radiusKm?: number },
): TravelPostWithAuthor[] {
  if (mode === "popular") return sortPostsByPopularity(posts);
  if (mode === "nearby") {
    const lat = options?.userLat;
    const lon = options?.userLon;
    if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return posts.filter((p) => Boolean(p.location?.trim()));
    }
    const radius = options?.radiusKm ?? 120;
    return posts
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        post: p,
        dist: haversineKm(
          { lat, lon },
          { lat: Number(p.latitude), lon: Number(p.longitude) },
        ),
      }))
      .filter(({ dist }) => dist <= radius)
      .sort((a, b) => a.dist - b.dist)
      .map(({ post }) => post);
  }
  return posts;
}
