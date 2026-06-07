import { describe, expect, it } from "vitest";
import { AIT_REWARDS, resolveCreatorRank } from "./ait";

describe("ait", () => {
  it("resolves creator rank by lifetime earnings", () => {
    expect(resolveCreatorRank(0).id).toBe("scout");
    expect(resolveCreatorRank(500).id).toBe("guide");
    expect(resolveCreatorRank(499).id).toBe("scout");
    expect(resolveCreatorRank(50_000).id).toBe("legend");
  });

  it("defines welcome reward", () => {
    expect(AIT_REWARDS.welcome).toBe(100);
  });
});
