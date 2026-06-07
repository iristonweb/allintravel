import rateLimit from "express-rate-limit";
import type { Request } from "express";
import type { SessionUser } from "./auth-session";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function authenticatedUserId(req: Request): string | null {
  const user = req.user as SessionUser | undefined;
  return user?.claims?.sub ?? null;
}

function rateLimitMessage(message: string) {
  return { ok: false, error: "rate_limit", message };
}

/** Brute-force protection for email/password login. */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `login:${clientIp(req)}`,
  message: rateLimitMessage("Слишком много попыток входа. Попробуйте позже."),
});

/** User/destination search endpoints. */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = authenticatedUserId(req);
    return userId ? `search:user:${userId}` : `search:ip:${clientIp(req)}`;
  },
  message: rateLimitMessage("Слишком много запросов поиска. Подождите минуту."),
});

/** Outbound chat and direct messages. */
export const messagingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = authenticatedUserId(req);
    return userId ? `msg:user:${userId}` : `msg:ip:${clientIp(req)}`;
  },
  message: rateLimitMessage("Слишком много сообщений. Подождите немного."),
});

/** File uploads (avatars, chat media, music). */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = authenticatedUserId(req);
    return userId ? `upload:user:${userId}` : `upload:ip:${clientIp(req)}`;
  },
  message: rateLimitMessage("Слишком много загрузок. Попробуйте позже."),
});
