import { createHash } from "crypto";

/** Deterministic platform address from user id (custodial, off-chain). */
export function derivePlatformWalletAddress(userId: string): string {
  const hash = createHash("sha256").update(`ait-wallet:${userId}`).digest("base64url");
  const body = hash
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20)
    .toUpperCase();
  return `AIT${body}`;
}
