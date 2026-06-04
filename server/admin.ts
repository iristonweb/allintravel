/** Emails that always receive admin role (lowercase). */
export const DEFAULT_ADMIN_EMAILS = ["iristonweb@gmail.com"] as const;

export function getAdminEmails(): Set<string> {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]);
}

export function resolveIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}
