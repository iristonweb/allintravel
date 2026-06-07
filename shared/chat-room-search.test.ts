import { describe, expect, it } from "vitest";
import { scoreChatRoomMatch } from "./chat-room-search";

describe("scoreChatRoomMatch", () => {
  const room = {
    title: "Путешествие в Исландию",
    slug: "iceland-trip",
    description: "Группа для поездки",
  };

  it("scores exact and prefix matches highest", () => {
    expect(scoreChatRoomMatch("iceland-trip", room)).toBeGreaterThan(95);
    expect(scoreChatRoomMatch("Путешествие", room)).toBeGreaterThan(85);
  });

  it("finds fuzzy typos", () => {
    expect(scoreChatRoomMatch("исландию", room)).toBeGreaterThan(0);
    expect(scoreChatRoomMatch("iceland-tri", room)).toBeGreaterThan(75);
  });
});
