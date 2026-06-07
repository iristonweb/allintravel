import { describe, expect, it } from "vitest";
import {
  encodeGifMessage,
  encodeReplyBlock,
  encodeVoiceMessage,
  messagePreview,
  parseChatMessage,
} from "./chat-message";

describe("chat-message", () => {
  it("encodes and parses gif messages", () => {
    const encoded = encodeGifMessage("https://media.giphy.com/x.gif");
    expect(parseChatMessage(encoded)).toEqual([
      { type: "gif", url: "https://media.giphy.com/x.gif" },
    ]);
  });

  it("encodes reply blocks with username", () => {
    const body = encodeReplyBlock("traveler", "Привет", "Ответ");
    expect(body.startsWith("[reply:@traveler|")).toBe(true);
    expect(messagePreview(body)).toContain("Ответ");
  });

  it("encodes voice with duration", () => {
    const encoded = encodeVoiceMessage("/uploads/voice.webm", 12.4);
    expect(encoded).toContain("|12]");
    expect(parseChatMessage(encoded)[0]).toMatchObject({ type: "voice", durationSec: 12 });
  });
});
