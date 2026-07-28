import { createHmac, timingSafeEqual } from "crypto";
import { getConfig } from "../config";

/**
 * Verify Telegram Mini App initData per Telegram WebApp docs.
 * Fail closed when bot token is configured.
 */
export function verifyTelegramInitData(initData: string): {
  ok: boolean;
  userId?: string;
  username?: string;
  reason?: string;
} {
  if (!initData?.trim()) {
    return { ok: false, reason: "Missing initData" };
  }

  const cfg = getConfig();
  const botToken = cfg.telegramBotToken;
  if (!botToken) {
    if (cfg.isProduction) {
      return { ok: false, reason: "TELEGRAM_BOT_TOKEN required in production" };
    }
    // Dev: parse without crypto verification
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) return { ok: false, reason: "Missing user" };
    try {
      const user = JSON.parse(userRaw) as { id?: number; username?: string };
      return {
        ok: true,
        userId: user.id != null ? String(user.id) : undefined,
        username: user.username,
      };
    } catch {
      return { ok: false, reason: "Invalid user JSON" };
    }
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "Missing hash" };
  params.delete("hash");

  const dataCheckString = [...Array.from(params.entries())]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Invalid hash" };
    }
  } catch {
    return { ok: false, reason: "Invalid hash encoding" };
  }

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 86400) {
    return { ok: false, reason: "initData expired" };
  }

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, reason: "Missing user" };
  try {
    const user = JSON.parse(userRaw) as { id?: number; username?: string };
    return {
      ok: true,
      userId: user.id != null ? String(user.id) : undefined,
      username: user.username,
    };
  } catch {
    return { ok: false, reason: "Invalid user JSON" };
  }
}
