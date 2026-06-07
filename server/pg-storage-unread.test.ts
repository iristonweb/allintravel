import { describe, it, expect } from "vitest";
import { countUnreadInRoomsBatchDb } from "./pg-storage-features";

describe("countUnreadInRoomsBatchDb", () => {
  it("returns empty map for no rooms", async () => {
    const db = {} as Parameters<typeof countUnreadInRoomsBatchDb>[0];
    const result = await countUnreadInRoomsBatchDb(db, [], "user-1");
    expect(result.size).toBe(0);
  });
});
