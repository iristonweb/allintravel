import rateLimit from "express-rate-limit";
import type { Request } from "express";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

/** Brute-force protection for email/password login. */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `login:${clientIp(req)}`,
  message: { ok: false, error: "rate_limit", message: "Слишком много попыток входа. Попробуйте позже." },
});
