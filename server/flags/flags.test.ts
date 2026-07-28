import { describe, expect, it, beforeEach } from "vitest";
import { resetConfigCache, loadConfig } from "../config";
import { bootstrapFlags, isEnabled, resetFlagsForTests, setFlag } from "./index";

describe("feature flags", () => {
  beforeEach(() => {
    resetFlagsForTests();
    resetConfigCache();
    loadConfig({ NODE_ENV: "test" });
  });

  it("defaults runtime_ddl to true", async () => {
    await bootstrapFlags();
    expect(await isEnabled("runtime_ddl")).toBe(true);
  });

  it("defaults risky flags to false", async () => {
    await bootstrapFlags();
    expect(await isEnabled("outbox_dispatch")).toBe(false);
    expect(await isEnabled("ait_double_entry")).toBe(false);
    expect(await isEnabled("payments_webhooks")).toBe(false);
    expect(await isEnabled("ai_tool_proposals")).toBe(false);
  });

  it("allows in-memory setFlag", async () => {
    await bootstrapFlags();
    await setFlag("outbox_dispatch", true);
    expect(await isEnabled("outbox_dispatch")).toBe(true);
  });
});
