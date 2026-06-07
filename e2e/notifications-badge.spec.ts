import { test, expect } from "@playwright/test";
import { hasE2eCredentials, loginViaApi } from "./helpers/auth";

test.describe("notifications unread badge", () => {
  test("chat room list shows unread badge API shape", async ({ request }) => {
    test.skip(!hasE2eCredentials(), "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E");
    const ok = await loginViaApi(request);
    expect(ok).toBe(true);

    const res = await request.get("/api/chat/rooms");
    expect(res.ok()).toBe(true);
    const rooms = (await res.json()) as { unreadCount?: number }[];
    expect(Array.isArray(rooms)).toBe(true);
    for (const room of rooms) {
      expect(typeof room.unreadCount).toBe("number");
    }
  });

  test("notifications endpoint returns unread count", async ({ request }) => {
    test.skip(!hasE2eCredentials(), "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E");
    const ok = await loginViaApi(request);
    expect(ok).toBe(true);

    const res = await request.get("/api/notifications?limit=5");
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { unreadNotifications?: number; items?: unknown[] };
    expect(typeof body.unreadNotifications).toBe("number");
    expect(Array.isArray(body.items)).toBe(true);
  });
});
