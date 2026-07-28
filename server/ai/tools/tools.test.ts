import { describe, expect, it, beforeEach } from "vitest";
import { isAuthorizedTool, assertAuthorizedTool } from "./registry";
import { createProposal, decideProposal, resetProposalsForTests } from "./proposals";

describe("AI tool registry", () => {
  beforeEach(() => {
    resetProposalsForTests();
  });

  it("allows only registered tools", () => {
    expect(isAuthorizedTool("suggest_stops")).toBe(true);
    expect(isAuthorizedTool("drop_database")).toBe(false);
    expect(() => assertAuthorizedTool("drop_database")).toThrow(/Unauthorized/);
  });

  it("requires human approval before apply", async () => {
    const created = await createProposal({
      userId: "u1",
      tripId: "t1",
      toolName: "suggest_stops",
      proposal: { suggestions: [] },
    });
    const storage = {
      addTripWaypoint: async () => {
        throw new Error("should not apply on reject");
      },
    } as unknown as import("../../storage").IStorage;
    const rejected = await decideProposal(created.id, "u1", "rejected", storage);
    expect(rejected.status).toBe("rejected");
    expect(rejected.applied).toBeUndefined();
  });
});
