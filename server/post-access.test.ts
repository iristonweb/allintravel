import { describe, expect, it } from "vitest";
import { canViewPost } from "./post-access";
import type { TravelPost } from "@shared/schema";

function post(overrides: Partial<TravelPost> = {}): TravelPost {
  return {
    id: "p1",
    userId: "owner",
    title: "t",
    content: "c",
    isPublic: false,
    format: "post",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TravelPost;
}

describe("canViewPost", () => {
  it("denies null post", () => {
    expect(canViewPost(null, "u1")).toBe(false);
  });

  it("allows public post for guests", () => {
    expect(canViewPost(post({ isPublic: true }), null)).toBe(true);
  });

  it("denies private post for non-owner", () => {
    expect(canViewPost(post({ isPublic: false }), "other")).toBe(false);
  });

  it("allows private post for owner", () => {
    expect(canViewPost(post({ userId: "owner", isPublic: false }), "owner")).toBe(true);
  });
});
