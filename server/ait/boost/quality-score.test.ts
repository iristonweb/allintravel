import { describe, expect, it } from "vitest";
import { parseTrustScoreValue } from "./quality-score";

describe("parseTrustScoreValue", () => {
  it("reads score column values correctly", () => {
    expect(parseTrustScoreValue(72)).toBe(72);
    expect(parseTrustScoreValue(undefined)).toBe(50);
    expect(parseTrustScoreValue(null)).toBe(50);
  });

  it("clamps to 0..100", () => {
    expect(parseTrustScoreValue(150)).toBe(100);
    expect(parseTrustScoreValue(-5)).toBe(0);
  });
});
