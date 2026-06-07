import type { Request } from "express";
import type { SessionUser } from "../auth-session";

/** Express request after `isAuthenticated` / `isAdmin` middleware. */
export type AuthenticatedRequest = Request & {
  user: SessionUser;
};

export function getAuthUserId(req: Request): string | undefined {
  const user = req.user as SessionUser | undefined;
  return user?.claims?.sub;
}
