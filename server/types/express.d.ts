import type { SessionUser } from "../auth-session";

declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}

export {};
