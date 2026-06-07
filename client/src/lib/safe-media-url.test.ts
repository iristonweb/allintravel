import { describe, expect, it } from "vitest";
import { isAllowedMediaPath, isSafeChatMediaUrl } from "./safe-media-url";

describe("safe-media-url", () => {
  it("allows upload paths", () => {
    expect(isAllowedMediaPath("/uploads/abc.jpg")).toBe(true);
    expect(isAllowedMediaPath("/api/media/blob/xyz")).toBe(true);
    expect(isAllowedMediaPath("/other/path")).toBe(false);
  });

  it("allows sticker and upload chat media", () => {
    expect(isSafeChatMediaUrl("/stickers/wave.png")).toBe(true);
    expect(isSafeChatMediaUrl("/uploads/chat/file.jpg")).toBe(true);
  });

  it("allows trusted CDN hosts", () => {
    expect(isSafeChatMediaUrl("https://media.giphy.com/media/abc/giphy.gif")).toBe(true);
  });

  it("rejects unknown hosts", () => {
    expect(isSafeChatMediaUrl("https://evil.example.com/image.png")).toBe(false);
  });
});
