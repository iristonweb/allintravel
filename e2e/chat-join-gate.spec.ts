import { test, expect } from "@playwright/test";
import { hasE2eCredentials, loginViaApi } from "./helpers/auth";

test.describe("chat join-gate", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!hasE2eCredentials(), "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E");
    const ok = await loginViaApi(request);
    expect(ok).toBe(true);
  });

  test("shows join panel for public non-legacy room when not a member", async ({ page, request }) => {
    const slug = `e2e-join-${Date.now()}`;
    const createRes = await request.post("/api/chat/rooms", {
      data: {
        title: `E2E Join Gate ${slug}`,
        slug,
        visibility: "public",
        description: "E2E test room",
      },
    });
    test.skip(!createRes.ok(), "Could not create test room — user may lack permissions");
    const room = (await createRes.json()) as { slug: string };

    await page.goto(`/chat?room=${encodeURIComponent(room.slug)}`);
    await expect(page.getByText(/вступите в группу|join the group/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /вступить в группу|join group/i }).click();
    await expect(page.getByText(/вступите в группу|join the group/i)).not.toBeVisible({
      timeout: 15_000,
    });
  });
});
