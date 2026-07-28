import { describe, expect, it, beforeEach } from "vitest";
import { loadConfig, resetConfigCache } from "./config";

describe("loadConfig", () => {
  beforeEach(() => {
    resetConfigCache();
  });

  it("parses development defaults", () => {
    const cfg = loadConfig({ NODE_ENV: "development" });
    expect(cfg.nodeEnv).toBe("development");
    expect(cfg.isProduction).toBe(false);
    expect(cfg.port).toBe(5000);
  });

  it("fails closed on short SESSION_SECRET in production", () => {
    expect(() => loadConfig({ NODE_ENV: "production", SESSION_SECRET: "short" })).toThrow(
      /SESSION_SECRET/,
    );
  });

  it("parses feature flag env overrides", () => {
    const cfg = loadConfig({
      NODE_ENV: "test",
      FLAG_OUTBOX_DISPATCH: "true",
      FEATURE_FLAG_OVERRIDES: "ait_double_entry=true",
    });
    expect(cfg.envFlagDefaults.outbox_dispatch).toBe(true);
    expect(cfg.featureFlagOverrides.ait_double_entry).toBe(true);
  });
});
