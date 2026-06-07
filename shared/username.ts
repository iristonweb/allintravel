/** Username handle: 3–30 chars, lowercase letters, digits, underscore */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function validateUsername(
  raw: string,
): { ok: true; value: string } | { ok: false; message: string } {
  const value = normalizeUsername(raw);
  if (value.length < USERNAME_MIN) {
    return { ok: false, message: `Ник должен быть не короче ${USERNAME_MIN} символов` };
  }
  if (value.length > USERNAME_MAX) {
    return { ok: false, message: `Ник не длиннее ${USERNAME_MAX} символов` };
  }
  if (!USERNAME_REGEX.test(value)) {
    return { ok: false, message: "Только латиница (a–z), цифры и _" };
  }
  return { ok: true, value };
}

export function usernameBaseFromEmail(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "user";
  let base = local
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (base.length < USERNAME_MIN) base = `user_${base}`.replace(/_+/g, "_");
  return base.slice(0, USERNAME_MAX);
}
