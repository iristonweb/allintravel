import { describe, expect, it } from "vitest";
import {
  formatPostCommentNotificationBody,
  formatPostLikeActorsLabel,
  formatPostLikeNotificationBody,
} from "./notification-text";

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

describe("formatPostCommentNotificationBody", () => {
  it("formats single commenter with post preview", () => {
    const body = formatPostCommentNotificationBody(
      [{ displayName: "Anna" }],
      1,
      "Hello world",
      "Nice post!",
    );
    expect(body).toContain("Anna");
    expect(body).toContain("прокомментировала");
    expect(body).toContain("Nice post!");
  });

  it("formats aggregated commenters", () => {
    const body = formatPostCommentNotificationBody(
      [{ displayName: "Anna" }],
      3,
      "",
      "Latest comment",
    );
    expect(body).toContain("прокомментировали");
    expect(body).toContain("Latest comment");
  });
});
