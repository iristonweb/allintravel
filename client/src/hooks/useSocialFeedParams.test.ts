import { describe, expect, it } from "vitest";
import { contentFormatFromSearch, formatFromQuery } from "@/hooks/useSocialFeedParams";

describe("social feed format from URL", () => {
  it("defaults to feed", () => {
    expect(formatFromQuery(null)).toBe("feed");
    expect(contentFormatFromSearch("")).toBe("feed");
    expect(contentFormatFromSearch("mode=popular")).toBe("feed");
  });

  it("reads format= stories|reels|journals|public", () => {
    expect(contentFormatFromSearch("format=stories")).toBe("stories");
    expect(contentFormatFromSearch("?format=reels")).toBe("reels");
    expect(contentFormatFromSearch("format=journals&sort=new")).toBe("journals");
    expect(contentFormatFromSearch("format=public")).toBe("public");
  });

  it("maps create=1 on hub to stories", () => {
    expect(contentFormatFromSearch("create=1")).toBe("stories");
    expect(contentFormatFromSearch("format=reels&create=1")).toBe("reels");
  });
});
