import { describe, expect, it } from "vitest";
import { buildChatRedirectPath } from "./chat-redirect";

describe("buildChatRedirectPath", () => {
  it("redirects legacy /messages?with= to /chat", () => {
    expect(buildChatRedirectPath("with=user-1")).toBe("/chat?with=user-1&tab=personal");
  });

  it("preserves unread from param", () => {
    expect(buildChatRedirectPath("with=user-1&from=unread")).toBe(
      "/chat?with=user-1&tab=unread",
    );
  });

  it("redirects tab=unread without with", () => {
    expect(buildChatRedirectPath("tab=unread")).toBe("/chat?tab=unread");
  });

  it("defaults to personal tab", () => {
    expect(buildChatRedirectPath("")).toBe("/chat?tab=personal");
  });
});
