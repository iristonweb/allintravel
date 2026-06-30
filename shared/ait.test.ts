import { describe, expect, it } from "vitest";
import {
  AIT_REWARDS,
  boostPriceMultiplier,
  getDailyEmissionCap,
  resolveCreatorRank,
  resolveStreakBonus,
} from "./ait";

describe("ait", () => {
  it("resolves creator rank by lifetime earnings", () => {
    expect(resolveCreatorRank(0).id).toBe("scout");
    expect(resolveCreatorRank(500).id).toBe("guide");
    expect(resolveCreatorRank(499).id).toBe("scout");
    expect(resolveCreatorRank(50_000).id).toBe("legend");
  });

  it("has zero welcome grant (hard reset economy)", () => {
    expect(AIT_REWARDS.welcome).toBe(0);
  });

  it("resolves streak bonuses by tier", () => {
    expect(resolveStreakBonus(7)).toBe(2);
    expect(resolveStreakBonus(30)).toBe(10);
    expect(resolveStreakBonus(90)).toBe(50);
  });

  it("scales daily emission cap by platform age", () => {
    expect(getDailyEmissionCap(3)).toBe(100_000);
    expect(getDailyEmissionCap(8)).toBe(75_000);
    expect(getDailyEmissionCap(18)).toBe(50_000);
    expect(getDailyEmissionCap(30)).toBe(25_000);
  });

  it("applies boost quality score price multipliers", () => {
    expect(boostPriceMultiplier(95)).toBe(0.5);
    expect(boostPriceMultiplier(65)).toBe(1);
    expect(boostPriceMultiplier(45)).toBe(2);
  });
});
