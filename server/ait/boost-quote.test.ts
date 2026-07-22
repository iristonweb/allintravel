import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(() => null),
}));

vi.mock("../storage", () => ({
  storage: {
    getTravelPost: vi.fn(),
    getPostLikesCount: vi.fn(async () => 5),
    getPostCommentsCount: vi.fn(async () => 2),
  },
}));

vi.mock("./boost/proof-of-experience", () => ({
  checkProofOfExperience: vi.fn(async () => ({
    verified: true,
    discountMultiplier: 1,
  })),
}));

vi.mock("./boost/quality-score", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./boost/quality-score")>();
  return {
    ...actual,
    computeQualityScore: vi.fn(async () => ({
      score: 80,
      engagement: 80,
      trust: 80,
      boostHistory: 60,
      relevance: 50,
    })),
  };
});

import { storage } from "../storage";
import { getBoostQuote } from "./boost/campaigns";
import { AIT_BOOST_BASE_COST } from "@shared/ait";

describe("getBoostQuote", () => {
  beforeEach(() => {
    vi.mocked(storage.getTravelPost).mockReset();
  });

  it("rejects non-owner", async () => {
    vi.mocked(storage.getTravelPost).mockResolvedValue({
      id: "p1",
      userId: "author",
      content: "hello world",
      location: "Paris",
    } as never);
    const quote = await getBoostQuote("other", "p1");
    expect(quote.ok).toBe(false);
  });

  it("returns QS-adjusted cost for owner", async () => {
    vi.mocked(storage.getTravelPost).mockResolvedValue({
      id: "p1",
      userId: "author",
      content: "hello world with enough text",
      location: "Paris, France",
    } as never);
    const quote = await getBoostQuote("author", "p1");
    expect(quote.ok).toBe(true);
    expect(quote.baseCost).toBe(AIT_BOOST_BASE_COST);
    expect(quote.cost).toBeGreaterThan(0);
    expect(quote.qualityScore).toBe(80);
  });
});
