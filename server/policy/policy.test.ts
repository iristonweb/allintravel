import { describe, expect, it } from "vitest";
import { authorize, authorizeSync, registerPolicy } from "./index";
import { canViewPostViaPolicy } from "./post-policies";
import type { TravelPost } from "@shared/schema";

describe("policy layer", () => {
  it("denies by default for unregistered actions", async () => {
    const decision = await authorize({ userId: "u1" }, "ai.apply", { type: "trip" });
    expect(decision.allow).toBe(false);
  });

  it("post.view matches canViewPost semantics", () => {
    const privatePost = {
      id: "p1",
      userId: "owner",
      isPublic: false,
    } as TravelPost;
    expect(canViewPostViaPolicy(privatePost, "other")).toBe(false);
    expect(canViewPostViaPolicy(privatePost, "owner")).toBe(true);
    expect(canViewPostViaPolicy({ ...privatePost, isPublic: true }, null)).toBe(true);
    expect(canViewPostViaPolicy(null, "u1")).toBe(false);
  });

  it("registerPolicy can allow", () => {
    registerPolicy("marketplace.purchase", () => ({ allow: true }));
    expect(authorizeSync({ userId: "u1" }, "marketplace.purchase", { type: "trip" }).allow).toBe(
      true,
    );
  });
});
