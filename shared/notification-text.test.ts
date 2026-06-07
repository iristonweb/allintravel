import { describe, expect, it } from "vitest";
import { formatPostLikeActorsLabel, formatPostLikeNotificationBody } from "./notification-text";

describe("formatPostLikeNotificationBody", () => {
  it("formats single liker", () => {
    expect(formatPostLikeNotificationBody([{ displayName: "Anna" }], 1, "Hello world")).toContain(
      "Anna",
    );
    expect(formatPostLikeNotificationBody([{ displayName: "Anna" }], 1, "Hello world")).toContain(
      "оценила",
    );
  });

  it("formats aggregated likers", () => {
    expect(formatPostLikeActorsLabel([{ displayName: "Anna" }], 4)).toBe("Anna и ещё 3");
    expect(formatPostLikeNotificationBody([{ displayName: "Anna" }], 4, "")).toContain("оценили");
  });
});
