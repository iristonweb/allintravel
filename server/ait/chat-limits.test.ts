import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(() => null),
}));

import { canCreateChatRoom, getMaxOwnedChatRooms } from "./perks";
import * as store from "./store";

describe("chat room limits", () => {
  it("defaults to 2 max rooms without extras", async () => {
    const userId = "room-limit-user";
    await store.ensureAitSchema();
    const max = await getMaxOwnedChatRooms(userId);
    expect(max).toBe(2);
    const can = await canCreateChatRoom(userId);
    expect(can).toBe(true);
  });

  it("increases max with extra_chat_room entitlement", async () => {
    const userId = "room-limit-extra";
    await store.ensureAitSchema();
    await store.addEntitlement(userId, "extra_chat_room", null, null);
    const max = await getMaxOwnedChatRooms(userId);
    expect(max).toBe(3);
  });
});
