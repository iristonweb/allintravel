import type { APIRequestContext, Page } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_EMAIL ?? "";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";

export function hasE2eCredentials(): boolean {
  return Boolean(E2E_EMAIL && E2E_PASSWORD);
}

export async function loginViaApi(request: APIRequestContext): Promise<boolean> {
  if (!hasE2eCredentials()) return false;
  const res = await request.post("/api/auth/login", {
    data: { email: E2E_EMAIL, password: E2E_PASSWORD },
  });
  return res.ok();
}

export async function loginViaUi(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email|почта/i).fill(E2E_EMAIL);
  await page.getByLabel(/password|пароль/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /войти|sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}
