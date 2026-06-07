import { test, expect } from "@playwright/test";
import { hasE2eCredentials, loginViaApi } from "./helpers/auth";

test.describe("chat discover and join", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!hasE2eCredentials(), "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E");
    const ok = await loginViaApi(request);
    expect(ok).toBe(true);
  });

  test("header search dialog discovers and joins a group", async ({ page, request }) => {
    const slug = `e2e-disc-${Date.now()}`;
    const title = `E2E Discover ${slug}`;
    const createRes = await request.post("/api/chat/rooms", {
      data: { title, slug, visibility: "public" },
    });
    test.skip(!createRes.ok(), "Could not create test room");
    const room = (await createRes.json()) as { slug: string; title: string };

    await page.goto("/");
    await page.getByRole("button", { name: /поиск|search/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByPlaceholder(/название группы|group name/i).fill(room.title.slice(0, 8));
    await expect(page.getByText(room.title)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /^вступить$|^join$/i }).first().click();
    await page.waitForURL(/\/chat\?room=/, { timeout: 15_000 });
    expect(page.url()).toContain(room.slug);
  });

  test("hero groups mode opens search dialog when logged in", async ({ page }) => {
    await page.goto("/");
    await page.locator('select:has(option[value="groups"])').selectOption("groups");
    await page.getByPlaceholder(/название группы|group name/i).fill("E2E");
    await page.getByRole("button", { name: /найти|search/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });
});
