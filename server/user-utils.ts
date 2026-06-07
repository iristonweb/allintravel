import type { User } from "@shared/schema";
import { usernameBaseFromEmail, USERNAME_MAX } from "@shared/username";

export type PublicUser = Pick<
  User,
  "id" | "username" | "displayName" | "firstName" | "lastName" | "profileImageUrl"
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username ?? null,
    displayName: user.displayName ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
  };
}

/** Current user session / profile — no password hash */
export function toSelfUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}

export interface UsernameStorage {
  getUserByUsername(username: string): Promise<User | undefined>;
}

export async function generateUniqueUsername(
  storage: UsernameStorage,
  email: string,
): Promise<string> {
  const base = usernameBaseFromEmail(email).slice(0, USERNAME_MAX - 4) || "user";
  let candidate = base.slice(0, USERNAME_MAX);
  let n = 0;
  while (await storage.getUserByUsername(candidate)) {
    n += 1;
    const suffix = String(n);
    candidate = `${base.slice(0, USERNAME_MAX - suffix.length)}${suffix}`;
  }
  return candidate;
}
