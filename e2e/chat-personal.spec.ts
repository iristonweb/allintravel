import { test, expect } from "@playwright/test";
import { hasE2eCredentials, loginViaApi } from "./helpers/auth";

test.describe("unified chat page", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!hasE2eCredentials(), "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E");
    const ok = await loginViaApi(request);
    expect(ok).toBe(true);
  });

  test("/messages?with= redirects to /chat with with and tab params", async ({ page }) => {
    await page.goto("/messages?with=00000000-0000-4000-8000-000000000001");
    await page.waitForURL(/\/chat\?/, { timeout: 10_000 });
    expect(page.url()).toContain("with=");
    expect(page.url()).toMatch(/tab=(personal|unread)/);
  });

  test("personal tab shows dialog list placeholder until a thread is selected", async ({
    page,
  }) => {
    await page.goto("/chat?tab=personal");
    await expect(page.getByRole("heading", { name: /^чаты$/i })).toBeVisible();
    await expect(page.getByText(/личные сообщения|выберите диалог/i)).toBeVisible();
  });

  test("unread tab shows unified empty or list state", async ({ page }) => {
    await page.goto("/chat?tab=unread");
    await expect(page.getByRole("heading", { name: /^чаты$/i })).toBeVisible();
    await expect(
      page.getByText(/непрочитанные|нет непрочитанных|личные|группы/i).first(),
    ).toBeVisible();
  });

  test("group room opens in thread panel from unread tab", async ({ page, request }) => {
    const roomsRes = await request.get("/api/chat/rooms");
    test.skip(!roomsRes.ok(), "Could not load rooms");
    const rooms = (await roomsRes.json()) as {
      slug: string;
      title: string;
      unreadCount?: number;
    }[];
    const unread = rooms.find((r) => (r.unreadCount ?? 0) > 0);
    test.skip(!unread, "No unread group rooms for this user");

    await page.goto(`/chat?tab=unread&room=${encodeURIComponent(unread.slug)}`);
    await expect(page.getByRole("heading", { name: unread.title })).toBeVisible({
      timeout: 10_000,
    });
  });
});
