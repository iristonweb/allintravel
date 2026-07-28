/** Founder accounts always receive platform admin (union with ADMIN_EMAILS env). */
export const FOUNDER_ADMIN_EMAILS = ["iristonweb@gmail.com"] as const;

/** Lifetime premium sentinel (year 9999 UTC). */
export const PREMIUM_LIFETIME_UNTIL = new Date("9999-12-31T23:59:59.000Z");

export const FOUNDER_PREMIUM_SKUS = ["creator_badge", "theme_aurora", "extra_chat_room"] as const;

export function getAdminEmails(): Set<string> {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...FOUNDER_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv]);
}

export function resolveIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}

export function isPremiumActive(premiumUntil: Date | string | null | undefined): boolean {
  if (!premiumUntil) return false;
  const until = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > Date.now();
}

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return FOUNDER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.trim().toLowerCase());
}
