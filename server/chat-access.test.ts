import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "./storage";
import { resolveChatRoomAccess } from "./chat-access";

describe("resolveChatRoomAccess", () => {
  let storage: MemStorage;
  const ownerId = "user-owner";
  const strangerId = "user-stranger";

  beforeEach(async () => {
    storage = new MemStorage();
    await storage.upsertUser({
      id: ownerId,
      email: "owner@test.com",
      displayName: "Owner",
    });
    await storage.upsertUser({
      id: strangerId,
      email: "stranger@test.com",
      displayName: "Stranger",
    });
  });

  it("allows legacy room access without membership", async () => {
    const result = await resolveChatRoomAccess(storage, "general", strangerId);
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.room.slug).toBe("general");
      expect(result.isMember).toBe(false);
    }
  });

  it("returns joinRequired for non-legacy public room when not a member", async () => {
    const room = await storage.createChatRoom({
      title: "Test Travel Group",
      description: "A public group",
      visibility: "public",
      createdBy: ownerId,
    });

    const result = await resolveChatRoomAccess(storage, room.slug, strangerId);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.joinRequired).toBe(true);
      expect(result.room?.id).toBe(room.id);
    }
  });

  it("allows access after joining a public room", async () => {
    const room = await storage.createChatRoom({
      title: "Joinable Group",
      visibility: "public",
      createdBy: ownerId,
    });
    await storage.joinChatRoom(room.id, strangerId);

    const result = await resolveChatRoomAccess(storage, room.slug, strangerId);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.isMember).toBe(true);
  });

  it("excludes joined rooms from discover results", async () => {
    const room = await storage.createChatRoom({
      title: "Discoverable Alps",
      visibility: "public",
      createdBy: ownerId,
    });
    await storage.joinChatRoom(room.id, strangerId);

    const discover = await storage.discoverChatRooms(strangerId, "Alps", 10);
    expect(discover.some((r) => r.id === room.id)).toBe(false);
  });

  it("returns discover results for non-member", async () => {
    await storage.createChatRoom({
      title: "Tokyo Explorers",
      visibility: "public",
      createdBy: ownerId,
    });

    const discover = await storage.discoverChatRooms(strangerId, "Tokyo", 10);
    expect(discover.length).toBeGreaterThan(0);
    expect(discover[0]!.title).toContain("Tokyo");
  });
});

describe("listChatRoomsForUser unread counts", () => {
  it("counts unread messages from other users", async () => {
    const storage = new MemStorage();
    const userA = "user-a";
    const userB = "user-b";
    await storage.upsertUser({ id: userA, email: "a@test.com", displayName: "A" });
    await storage.upsertUser({ id: userB, email: "b@test.com", displayName: "B" });

    const room = await storage.createChatRoom({
      title: "Unread Test",
      visibility: "public",
      createdBy: userA,
    });
    await storage.joinChatRoom(room.id, userB);

    await storage.createChatMessage({
      userId: userB,
      content: "Hello",
      chatRoom: room.slug,
    });
    await storage.createChatMessage({
      userId: userB,
      content: "Second",
      chatRoom: room.slug,
    });
    await storage.createChatMessage({
      userId: userA,
      content: "Own message",
      chatRoom: room.slug,
    });

    const rooms = await storage.listChatRoomsForUser(userA);
    const target = rooms.find((r) => r.id === room.id);
    expect(target?.unreadCount).toBe(2);
  });
});
