import { describe, expect, it } from "vitest";
import {
  feedModeFromQuery,
  feedModeToQuery,
  filterPostsForFeedMode,
  sortPostsByPopularity,
  sortPostsByTrending,
} from "./feed-utils";
import type { TravelPostWithAuthor } from "@shared/schema";

const post = (id: string, likes: number): TravelPostWithAuthor =>
  ({ id, likesCount: likes }) as TravelPostWithAuthor;

describe("feed-utils", () => {
  it("parses feed mode from query", () => {
    expect(feedModeFromQuery(null)).toBe("all");
    expect(feedModeFromQuery("following")).toBe("following");
    expect(feedModeFromQuery("popular")).toBe("popular");
    expect(feedModeFromQuery("nearby")).toBe("nearby");
    expect(feedModeFromQuery("unknown")).toBe("all");
  });

  it("builds query string for non-default modes", () => {
    expect(feedModeToQuery("all")).toBe("");
    expect(feedModeToQuery("popular")).toBe("?mode=popular");
  });

  it("sorts and filters popular posts", () => {
    const posts = [post("a", 1), post("b", 5), post("c", 3)];
    expect(sortPostsByPopularity(posts).map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(filterPostsForFeedMode(posts, "all").length).toBe(3);
    expect(filterPostsForFeedMode(posts, "popular")[0]?.id).toBe("b");
  });

  it("sorts trending posts by engagement score", () => {
    const posts = [
      { ...post("a", 1), commentsCount: 0, createdAt: new Date().toISOString() },
      { ...post("b", 2), commentsCount: 5, createdAt: new Date().toISOString() },
    ] as TravelPostWithAuthor[];
    expect(sortPostsByTrending(posts)[0]?.id).toBe("b");
    expect(feedModeFromQuery("trending")).toBe("trending");
    expect(filterPostsForFeedMode(posts, "trending")[0]?.id).toBe("b");
  });
});
