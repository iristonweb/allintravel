import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameBaseFromEmail, validateUsername } from "./username";

describe("username", () => {
  it("normalizes @ prefix and casing", () => {
    expect(normalizeUsername("@Traveler")).toBe("traveler");
  });

  it("accepts valid usernames", () => {
    expect(validateUsername("abc")).toEqual({ ok: true, value: "abc" });
    expect(validateUsername("user_42")).toEqual({ ok: true, value: "user_42" });
  });

  it("rejects too short and invalid characters", () => {
    expect(validateUsername("ab").ok).toBe(false);
    expect(validateUsername("bad-name").ok).toBe(false);
  });

  it("builds base from email", () => {
    expect(usernameBaseFromEmail("John.Doe@Example.com")).toBe("john_doe");
  });
});
