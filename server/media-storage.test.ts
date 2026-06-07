import { describe, expect, it, afterEach } from "vitest";
import {
  assertPersistentMediaUrl,
  blobDeliveryUrl,
  isEphemeralMediaUrl,
  isValidBlobDeliveryPathname,
} from "./media-storage";

describe("media-storage", () => {
  const origVercel = process.env.VERCEL;

  afterEach(() => {
    if (origVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = origVercel;
  });

  it("builds blob delivery URL", () => {
    expect(blobDeliveryUrl("media/abc.jpg")).toBe("/api/media/blob?pathname=media%2Fabc.jpg");
  });

  it("validates blob pathname prefixes", () => {
    expect(isValidBlobDeliveryPathname("media/x.jpg")).toBe(true);
    expect(isValidBlobDeliveryPathname("avatars/u1/x.jpg")).toBe(true);
    expect(isValidBlobDeliveryPathname("../etc/passwd")).toBe(false);
    expect(isValidBlobDeliveryPathname("/absolute")).toBe(false);
  });

  it("detects ephemeral URLs on Vercel", () => {
    process.env.VERCEL = "1";
    expect(isEphemeralMediaUrl("/uploads/x.jpg")).toBe(true);
    expect(isEphemeralMediaUrl("https://cdn.example/x.jpg")).toBe(false);
    expect(isEphemeralMediaUrl("data:image/png;base64,abc")).toBe(true);
  });

  it("assertPersistentMediaUrl rejects data URLs", () => {
    expect(() => assertPersistentMediaUrl("data:image/png;base64,abc")).toThrow();
  });

  it("assertPersistentMediaUrl rejects /uploads on Vercel", () => {
    process.env.VERCEL = "1";
    expect(() => assertPersistentMediaUrl("/uploads/x.jpg")).toThrow(/Vercel Blob/);
  });
});
