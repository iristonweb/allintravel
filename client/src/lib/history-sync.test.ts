/**
 * @vitest-environment node
 *
 * History sync needs a minimal browser global stub (no jsdom in the project).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function installBrowserStub() {
  const listeners = new Map<string, Set<(event: { type: string }) => void>>();

  class FakeCustomEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  }

  const history = {
    pushState: vi.fn(function pushState(this: unknown, ..._args: unknown[]) {
      return undefined;
    }),
    replaceState: vi.fn(function replaceState(this: unknown, ..._args: unknown[]) {
      return undefined;
    }),
  };

  const windowStub = {
    history,
    addEventListener: (type: string, fn: (event: { type: string }) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: (event: { type: string }) => void) => {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent: (event: { type: string }) => {
      listeners.get(event.type)?.forEach((fn) => fn(event));
      return true;
    },
  };

  vi.stubGlobal("CustomEvent", FakeCustomEvent);
  vi.stubGlobal("window", windowStub);
  return { windowStub, listeners };
}

describe("history-sync", () => {
  beforeEach(() => {
    vi.resetModules();
    installBrowserStub();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("dispatches ait:location on pushState", async () => {
    const { ensureHistorySync } = await import("./history-sync");
    ensureHistorySync();
    const spy = vi.fn();
    window.addEventListener("ait:location", spy);
    window.history.pushState({}, "", "/social-feed?format=reels");
    expect(spy).toHaveBeenCalled();
  });

  it("notifyHistoryChange dispatches event", async () => {
    const { notifyHistoryChange } = await import("./history-sync");
    const spy = vi.fn();
    window.addEventListener("ait:location", spy);
    notifyHistoryChange();
    expect(spy).toHaveBeenCalled();
  });
});
