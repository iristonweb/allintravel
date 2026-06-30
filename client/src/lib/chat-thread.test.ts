import { describe, expect, it } from "vitest";
import {
  chatDateSeparatorKey,
  formatChatDateSeparator,
  shouldGroupChatMessages,
} from "./chat-thread";

describe("chat-thread helpers", () => {
  it("groups messages within 5 minutes from same author", () => {
    const prev = { id: "1", createdAt: "2026-01-01T12:00:00Z" };
    const next = { id: "2", createdAt: "2026-01-01T12:04:00Z" };
    expect(shouldGroupChatMessages(prev, next, true)).toBe(true);
    expect(shouldGroupChatMessages(prev, next, false)).toBe(false);
  });

  it("formats today and yesterday labels", () => {
    const now = new Date();
    const labels = { today: "Today", yesterday: "Yesterday" };
    expect(formatChatDateSeparator(now, labels)).toBe("Today");
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatChatDateSeparator(yesterday, labels)).toBe("Yesterday");
  });

  it("builds date separator keys for same calendar day", () => {
    const morning = chatDateSeparatorKey("2026-06-30T10:00:00");
    const evening = chatDateSeparatorKey("2026-06-30T18:00:00");
    expect(morning).toBe(evening);
  });
});
