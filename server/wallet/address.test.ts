import { describe, expect, it } from "vitest";
import { derivePlatformWalletAddress } from "./address";

describe("derivePlatformWalletAddress", () => {
  it("returns stable AIT-prefixed address for user id", () => {
    const id = "user-abc-123";
    expect(derivePlatformWalletAddress(id)).toBe(derivePlatformWalletAddress(id));
    expect(derivePlatformWalletAddress(id)).toMatch(/^AIT[A-Z0-9]{10,24}$/);
  });

  it("differs for different users", () => {
    expect(derivePlatformWalletAddress("a")).not.toBe(derivePlatformWalletAddress("b"));
  });
});
