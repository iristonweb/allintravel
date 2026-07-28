import { describe, expect, it, beforeEach } from "vitest";
import { resetConfigCache, loadConfig } from "../config";
import { verifyTelegramInitData } from "./verify";

describe("verifyTelegramInitData", () => {
  beforeEach(() => {
    resetConfigCache();
  });

  it("parses user in development without bot token", () => {
    loadConfig({ NODE_ENV: "development" });
    const initData = `user=${encodeURIComponent(JSON.stringify({ id: 42, username: "traveler" }))}`;
    const result = verifyTelegramInitData(initData);
    expect(result.ok).toBe(true);
    expect(result.userId).toBe("42");
    expect(result.username).toBe("traveler");
  });

  it("rejects missing initData", () => {
    loadConfig({ NODE_ENV: "development" });
    expect(verifyTelegramInitData("").ok).toBe(false);
  });

  it("fails closed in production without bot token", () => {
    resetConfigCache();
    loadConfig({
      NODE_ENV: "production",
      SESSION_SECRET: "ci-github-actions-session-secret-min-32-chars",
      TELEGRAM_BOT_TOKEN: "",
      VERCEL: undefined,
    } as NodeJS.ProcessEnv);
    const initData = `user=${encodeURIComponent(JSON.stringify({ id: 1 }))}`;
    expect(verifyTelegramInitData(initData).ok).toBe(false);
  });
});
