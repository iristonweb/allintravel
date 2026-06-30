import { describe, expect, it } from "vitest";
import { calculateBurnAmount } from "./burns";
import { boostPriceMultiplier } from "@shared/ait";

describe("ait economy calculations", () => {
  it("calculates burn amounts from gross and rate", () => {
    expect(calculateBurnAmount(200, 0.1)).toBe(20);
    expect(calculateBurnAmount(100, 0.02)).toBe(2);
    expect(calculateBurnAmount(0, 0.1)).toBe(0);
  });

  it("computes boost cost multiplier from quality score", () => {
    const base = 200;
    expect(Math.floor(base * boostPriceMultiplier(90))).toBe(100);
    expect(Math.floor(base * boostPriceMultiplier(55))).toBe(250);
  });
});
