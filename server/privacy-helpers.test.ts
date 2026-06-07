import { describe, expect, it } from "vitest";
import { audienceAllows, canSendDm, canViewProfile, defaultPrivacyRow } from "./privacy-helpers";

describe("privacy-helpers", () => {
  const settings = defaultPrivacyRow("user-a");

  it("audienceAllows respects self and friends", () => {
    expect(audienceAllows("friends", { isSelf: true, isFriend: false })).toBe(true);
    expect(audienceAllows("friends", { isSelf: false, isFriend: true })).toBe(true);
    expect(audienceAllows("friends", { isSelf: false, isFriend: false })).toBe(false);
    expect(audienceAllows("everyone", { isSelf: false, isFriend: false })).toBe(true);
  });

  it("canViewProfile allows owner always", () => {
    expect(canViewProfile(settings, "user-a", "user-a", false)).toBe(true);
  });

  it("canSendDm blocks self and respects audience", () => {
    expect(canSendDm(settings, "user-a", "user-a", false)).toBe(false);
    expect(canSendDm({ ...settings, allowDmFrom: "everyone" }, "user-b", "user-a", false)).toBe(
      true,
    );
  });
});
