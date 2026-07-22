import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(() => null),
}));

import * as store from "./store";
import { spendCatalogItem } from "./service";

async function seedBalance(userId: string, spend: number, creator: number) {
  await store.ensureAitSchema();
  if (spend > 0) {
    await store.applyBalanceDeltaRaw(userId, "spend", spend, "admin_adjust", "seed", null, null);
  }
  if (creator > 0) {
    await store.applyBalanceDeltaRaw(
      userId,
      "creator",
      creator,
      "admin_adjust",
      "seed",
      null,
      null,
    );
  }
}

describe("spendCatalogItem", () => {
  it("debits creator then spend via dual wallet", async () => {
    const userId = "shop-freeze-1";
    await seedBalance(userId, 500, 300);
    const result = await spendCatalogItem(userId, "streak_freeze");
    expect(result.ok).toBe(true);
    const balance = await store.getOrCreateBalance(userId);
    expect(balance.spendBalance + balance.creatorBalance).toBe(700);
  });

  it("allows stackable extra_chat_room purchases", async () => {
    const userId = "shop-stack-1";
    await seedBalance(userId, 1500, 500);
    const first = await spendCatalogItem(userId, "extra_chat_room");
    const second = await spendCatalogItem(userId, "extra_chat_room");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    const ents = await store.getEntitlements(userId);
    expect(ents.filter((e) => e.sku === "extra_chat_room").length).toBe(2);
  });

  it("blocks duplicate permanent theme purchase", async () => {
    const userId = "shop-theme-1";
    await seedBalance(userId, 500, 500);
    const first = await spendCatalogItem(userId, "theme_aurora");
    const second = await spendCatalogItem(userId, "theme_aurora");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.message).toMatch(/уже есть/i);
  });

  it("requires roomId for room_spotlight_48h", async () => {
    const userId = "shop-spotlight-1";
    await seedBalance(userId, 500, 0);
    const result = await spendCatalogItem(userId, "room_spotlight_48h");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/группу/i);
  });

  it("activates room_spotlight_48h for a specific room", async () => {
    const userId = "shop-spotlight-2";
    const roomId = "room-abc-123";
    await seedBalance(userId, 500, 0);
    const result = await spendCatalogItem(userId, "room_spotlight_48h", { roomId });
    expect(result.ok).toBe(true);
    const ents = await store.getEntitlements(userId);
    const spotlight = ents.find((e) => e.sku === "room_spotlight_48h");
    expect(spotlight?.entityId).toBe(roomId);
    expect(spotlight?.expiresAt).toBeTruthy();
  });

  it("blocks streak_freeze after monthly limit", async () => {
    const userId = "shop-freeze-limit";
    await seedBalance(userId, 2000, 0);
    for (let i = 0; i < 3; i++) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
      await store.setLastActiveDate(userId, twoDaysAgo.toISOString().slice(0, 10));
      const r = await spendCatalogItem(userId, "streak_freeze");
      expect(r.ok).toBe(true);
    }
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    await store.setLastActiveDate(userId, twoDaysAgo.toISOString().slice(0, 10));
    const fourth = await spendCatalogItem(userId, "streak_freeze");
    expect(fourth.ok).toBe(false);
    expect(fourth.message).toMatch(/лимит/i);
  });

  it("blocks streak_freeze when already active today", async () => {
    const userId = "shop-freeze-today";
    await seedBalance(userId, 2000, 0);
    const today = new Date().toISOString().slice(0, 10);
    await store.setLastActiveDate(userId, today);
    const result = await spendCatalogItem(userId, "streak_freeze");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/сегодня/i);
  });
});

describe("debitDualWallet", () => {
  it("uses creator balance before spend", async () => {
    const userId = "dual-wallet-user";
    await seedBalance(userId, 50, 100);
    const ok = await store.debitDualWallet(userId, 120, "spend_shop", "test", "sku", "x");
    expect(ok).toBe(true);
    const balance = await store.getOrCreateBalance(userId);
    expect(balance.creatorBalance).toBe(0);
    expect(balance.spendBalance).toBe(30);
  });
});
