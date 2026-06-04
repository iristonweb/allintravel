import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { getSessionPool } from "./db";
import { setupGoogleAuth } from "./google-auth";
import { hashPassword, isPasswordLongEnough, verifyPassword } from "./password";
import { resolveIsAdmin } from "./admin";
import type { User } from "@shared/schema";

async function syncAdminRole(user: User): Promise<User> {
  if (!resolveIsAdmin(user.email) || user.isAdmin) return user;
  return storage.setUserAdmin(user.id, true);
}

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
const PgSession = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

let sessionMiddleware: ReturnType<typeof session> | null = null;

export function getSession() {
  if (sessionMiddleware) return sessionMiddleware;

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const pgPool = getSessionPool();

  let store: session.Store;
  try {
    store = pgPool
      ? new PgSession({
          pool: pgPool,
          tableName: "sessions",
          createTableIfMissing: true,
        })
      : new MemoryStore({ checkPeriod: 86_400_000 });
  } catch (err) {
    console.error("[auth] session store init failed, using memory:", err);
    store = new MemoryStore({ checkPeriod: 86_400_000 });
  }

  sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: sessionTtl,
      path: "/",
    },
  });

  return sessionMiddleware;
}

export type SessionUser = {
  claims: {
    sub: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profile_image_url?: string | null;
  };
};

function toSessionUser(user: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}): SessionUser {
  return {
    claims: {
      sub: user.id,
      email: user.email ?? undefined,
      first_name: user.firstName ?? undefined,
      last_name: user.lastName ?? undefined,
      profile_image_url: user.profileImageUrl ?? undefined,
    },
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const googleTimeoutMs = process.env.VERCEL ? 2_000 : 10_000;
  try {
    await Promise.race([
      setupGoogleAuth(app),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Google OAuth setup timeout")), googleTimeoutMs),
      ),
    ]);
  } catch (err) {
    console.error("[auth] Google OAuth setup skipped:", err);
  }

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, _password, done) => {
        try {
          if (storage.ensureSchema) {
            await storage.ensureSchema();
          }

          const trimmed = (email || "").trim().toLowerCase();
          const password = String(_password ?? "");

          if (!trimmed) {
            return done(null, false, { message: "Email is required" });
          }
          if (!isPasswordLongEnough(password)) {
            return done(null, false, { message: "Invalid email or password" });
          }

          let user = await storage.getUserByEmail(trimmed);

          if (!user) {
            const id = crypto.randomUUID();
            const passwordHash = await hashPassword(password);
            const { generateUniqueUsername } = await import("./user-utils");
            const username = await generateUniqueUsername(storage, trimmed);
            user = await storage.upsertUser({
              id,
              email: trimmed,
              username,
              firstName: null,
              lastName: null,
              profileImageUrl: null,
              passwordHash,
            });
            user = await syncAdminRole(user);
            return done(null, toSessionUser(user));
          }

          if (!user.passwordHash) {
            const passwordHash = await hashPassword(password);
            user = await storage.setUserPassword(user.id, passwordHash);
            user = await syncAdminRole(user);
            return done(null, toSessionUser(user));
          }

          const valid = await verifyPassword(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          user = await syncAdminRole(user);
          return done(null, toSessionUser(user));
        } catch (err) {
          console.error("[auth] local strategy error:", err);
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (_req, res) => {
    res.redirect("/login");
  });

  app.post(
    "/api/login",
    (req, res, next) => {
      const rawRedirect = typeof req.query.redirect === "string" ? req.query.redirect : "/";
      const safeRedirect =
        rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://")
          ? rawRedirect
          : "/";

      passport.authenticate("local", (err: unknown, user: Express.User | false | null) => {
        if (err) {
          console.error("[auth] POST /api/login authenticate:", err);
          const q = new URLSearchParams({ error: "server" });
          if (safeRedirect !== "/") q.set("redirect", safeRedirect);
          return res.redirect(`/login?${q.toString()}`);
        }
        if (!user) {
          const q = new URLSearchParams({ error: "invalid" });
          if (safeRedirect !== "/") q.set("redirect", safeRedirect);
          return res.redirect(`/login?${q.toString()}`);
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("[auth] session save failed:", loginErr);
            const q = new URLSearchParams({ error: "server" });
            if (safeRedirect !== "/") q.set("redirect", safeRedirect);
            return res.redirect(`/login?${q.toString()}`);
          }
          return res.redirect(safeRedirect);
        });
      })(req, res, next);
    },
  );

  const handleLogout = (req: import("express").Request, res: import("express").Response) => {
    req.logout((err) => {
      if (err) {
        return res.redirect("/");
      }
      res.redirect("/");
    });
  };

  app.get("/api/logout", handleLogout);
  app.post("/api/logout", handleLogout);
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user as SessionUser | undefined;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const sessionUser = req.user as SessionUser | undefined;
  const userId = sessionUser?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const dbUser = await storage.getUser(userId);
  if (!dbUser?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
