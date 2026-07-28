import { afterEach, describe, expect, it } from "vitest";
import { FOUNDER_ADMIN_EMAILS, getAdminEmails, isPremiumActive, resolveIsAdmin } from "./admin";

describe("admin allowlist + premium", () => {
  const prev = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  });

  it("always includes founder email", () => {
    process.env.ADMIN_EMAILS = "";
    const emails = getAdminEmails();
    expect(emails.has(FOUNDER_ADMIN_EMAILS[0])).toBe(true);
    expect(resolveIsAdmin("iristonweb@gmail.com")).toBe(true);
    expect(resolveIsAdmin("IRISTONWEB@GMAIL.COM")).toBe(true);
  });

  it("unions env ADMIN_EMAILS with founder", () => {
    process.env.ADMIN_EMAILS = "ops@example.com, other@example.com";
    const emails = getAdminEmails();
    expect(emails.has("iristonweb@gmail.com")).toBe(true);
    expect(emails.has("ops@example.com")).toBe(true);
    expect(emails.has("other@example.com")).toBe(true);
    expect(resolveIsAdmin("ops@example.com")).toBe(true);
    expect(resolveIsAdmin("nobody@example.com")).toBe(false);
  });

  it("isPremiumActive treats null as not premium", () => {
    expect(isPremiumActive(null)).toBe(false);
    expect(isPremiumActive(undefined)).toBe(false);
  });

  it("isPremiumActive is true for future / lifetime sentinel", () => {
    expect(isPremiumActive(new Date("9999-12-31T23:59:59.000Z"))).toBe(true);
    expect(isPremiumActive(new Date(Date.now() + 60_000))).toBe(true);
  });

  it("isPremiumActive is false for past dates", () => {
    expect(isPremiumActive(new Date("2020-01-01T00:00:00.000Z"))).toBe(false);
  });
});
