export type UserLabelFields = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
};

/** Primary label for chat lists, friend cards, notifications */
export function getUserDisplayLabel(u: UserLabelFields): string {
  if (u.displayName?.trim()) return u.displayName.trim();
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (u.username) return `@${u.username}`;
  const local = u.email?.split("@")[0];
  if (local) return local;
  return "Пользователь";
}

export function getUserHandle(u: { username?: string | null }): string | null {
  return u.username ? `@${u.username}` : null;
}

export function getUserInitial(u: UserLabelFields): string {
  const label = getUserDisplayLabel(u);
  return label.replace(/^@/, "")[0]?.toUpperCase() ?? "?";
}
