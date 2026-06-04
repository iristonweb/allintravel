import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { getSessionPool } from "./db";
import { setupGoogleAuth } from "./google-auth";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
const PgSession = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

let sessionMiddleware: ReturnType<typeof session> | null = null;

export function getSession() {
  if (sessionMiddleware) return sessionMiddleware;

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === "production";
  const pgPool = getSessionPool();

  const store = pgPool
    ? new PgSession({
        pool: pgPool,
        tableName: "sessions",
        createTableIfMissing: true,
      })
    : new MemoryStore({ checkPeriod: 86_400_000 });

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

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  await setupGoogleAuth(app);

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, _password, done) => {
        try {
          const trimmed = (email || "").trim().toLowerCase();
          if (!trimmed) {
            return done(null, false, { message: "Email is required" });
          }

          const accessCode = process.env.APP_ACCESS_CODE;
          const password = String(_password ?? "");
          if (process.env.NODE_ENV === "production" && !accessCode) {
            throw new Error("APP_ACCESS_CODE must be set in production");
          }
          if (accessCode && password !== accessCode) {
            return done(null, false, { message: "Invalid access code" });
          }

          let user = await storage.getUserByEmail(trimmed);
          if (!user) {
            const id = crypto.randomUUID();
            user = await storage.upsertUser({
              id,
              email: trimmed,
              firstName: null,
              lastName: null,
              profileImageUrl: null,
            });
          }
          const sessionUser: SessionUser = {
            claims: {
              sub: user.id,
              email: user.email ?? undefined,
              first_name: user.firstName ?? undefined,
              last_name: user.lastName ?? undefined,
              profile_image_url: user.profileImageUrl ?? undefined,
            },
          };
          return done(null, sessionUser);
        } catch (err) {
          return done(err);
        }
      }
    )
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
        if (err) return next(err);
        if (!user) {
          const q = new URLSearchParams({ error: "invalid" });
          if (safeRedirect !== "/") q.set("redirect", safeRedirect);
          return res.redirect(`/login?${q.toString()}`);
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          return res.redirect(safeRedirect);
        });
      })(req, res, next);
    }
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
