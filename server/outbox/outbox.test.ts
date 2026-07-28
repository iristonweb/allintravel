import { describe, expect, it, beforeEach } from "vitest";
import { resetConfigCache, loadConfig } from "../config";
import { resetFlagsForTests, bootstrapFlags } from "../flags";
import { enqueueOutbox, drainOutbox, registerOutboxHandler, resetOutboxForTests } from "./index";

describe("outbox", () => {
  beforeEach(() => {
    resetOutboxForTests();
    resetFlagsForTests();
    resetConfigCache();
  });

  it("does not dispatch when flag is off", async () => {
    loadConfig({ NODE_ENV: "test", FLAG_OUTBOX_DISPATCH: "false" });
    await bootstrapFlags();
    let called = 0;
    registerOutboxHandler("test.event", async () => {
      called += 1;
    });
    await enqueueOutbox("test.event", { a: 1 });
    const result = await drainOutbox();
    expect(result.processed).toBe(0);
    expect(called).toBe(0);
  }, 15_000);

  it("processes pending messages when flag is on", async () => {
    loadConfig({ NODE_ENV: "test", FLAG_OUTBOX_DISPATCH: "true" });
    await bootstrapFlags();
    let called = 0;
    registerOutboxHandler("test.event", async () => {
      called += 1;
    });
    await enqueueOutbox("test.event", { a: 1 });
    const result = await drainOutbox();
    expect(result.processed).toBe(1);
    expect(called).toBe(1);
  }, 15_000);
});
