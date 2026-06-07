import { describe, expect, it } from "vitest";
import { aggregateNotifications } from "./notification-aggregate";
import type { AppNotification } from "./notification-types";

function notif(
  id: string,
  type: AppNotification["type"],
  entityId: string,
  actorId: string,
  actorName: string,
  isRead = false,
): AppNotification {
  return {
    id,
    userId: "u1",
    type,
    title: "t",
    body: "b",
    link: `/social-feed?post=${entityId}`,
    actorId,
    entityId,
    isRead,
    createdAt: new Date().toISOString(),
    actor: {
      id: actorId,
      displayName: actorName,
    },
  };
}

describe("aggregateNotifications", () => {
  it("merges post_like on same entity", () => {
    const items = [
      notif("1", "post_like", "p1", "a1", "Anna"),
      notif("2", "post_like", "p1", "a2", "Bob"),
      notif("3", "post_like", "p1", "a3", "Claire"),
    ];
    const out = aggregateNotifications(items);
    expect(out).toHaveLength(1);
    expect(out[0]!.aggregateCount).toBe(3);
    expect(out[0]!.aggregateIds).toEqual(["1", "2", "3"]);
    expect(out[0]!.actors?.map((a) => a.displayName)).toEqual(["Anna", "Bob", "Claire"]);
  });

  it("leaves different entities separate", () => {
    const items = [
      notif("1", "post_like", "p1", "a1", "Anna"),
      notif("2", "post_like", "p2", "a2", "Bob"),
    ];
    expect(aggregateNotifications(items)).toHaveLength(2);
  });

  it("marks group unread if any member is unread", () => {
    const items = [
      notif("1", "post_like", "p1", "a1", "Anna", true),
      notif("2", "post_like", "p1", "a2", "Bob", false),
    ];
    expect(aggregateNotifications(items)[0]!.isRead).toBe(false);
  });

  it("merges post_like and post_comment on same entity separately", () => {
    const items = [
      notif("1", "post_like", "p1", "a1", "Anna"),
      notif("2", "post_comment", "p1", "a2", "Bob"),
      notif("3", "post_comment", "p1", "a3", "Claire"),
    ];
    const out = aggregateNotifications(items);
    expect(out).toHaveLength(2);
    const likes = out.find((n) => n.type === "post_like");
    const comments = out.find((n) => n.type === "post_comment");
    expect(likes?.aggregateCount).toBe(1);
    expect(comments?.aggregateCount).toBe(2);
  });
});
