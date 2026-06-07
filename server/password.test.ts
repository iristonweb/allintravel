import { describe, expect, it } from "vitest";
import { hashPassword, isPasswordLongEnough, verifyPassword } from "./password";

describe("password", () => {
  it("checks minimum length", () => {
    expect(isPasswordLongEnough("1234567")).toBe(false);
    expect(isPasswordLongEnough("12345678")).toBe(true);
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
