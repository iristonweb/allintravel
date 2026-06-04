import type { IStorage } from "./storage";

/** Public group chat rooms (must match client CHAT_ROOMS ids). */
export const PUBLIC_CHAT_ROOMS = new Set([
  "general",
  "europe",
  "asia",
  "america",
  "tips",
  "iceland-2024",
]);

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

export function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (isProductionEnv()) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "SESSION_SECRET must be set to a random string of at least 32 characters in production",
      );
    }
    return secret;
  }
  return secret || "dev-secret-change-in-production";
}

export function canAccessChatRoom(room: string): boolean {
  const normalized = room.trim().slice(0, 100);
  if (!normalized || normalized.includes("..")) return false;
  return PUBLIC_CHAT_ROOMS.has(normalized);
}

export async function userCanManageTrip(
  storage: IStorage,
  userId: string,
  tripId: string,
): Promise<boolean> {
  const trip = await storage.getTrip(tripId);
  if (!trip) return false;
  if (trip.userId === userId) return true;
  const participants = await storage.getTripParticipants(tripId);
  return participants.some(
    (p) => p.userId === userId && (p.status === "accepted" || p.status === "pending"),
  );
}

const SENSITIVE_KEYS = new Set([
  "email",
  "password",
  "passwordHash",
  "content",
  "message",
  "token",
  "secret",
  "authorization",
]);

/** Redact sensitive fields before logging API JSON bodies. */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[…]";
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((v) => redactForLog(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
    } else {
      out[key] = redactForLog(val, depth + 1);
    }
  }
  return out;
}
