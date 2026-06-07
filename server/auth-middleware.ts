import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import type { Express } from "express";
import { getSessionPool } from "./db";
import { resolveSessionSecret } from "./security";

const PgSession = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

let sessionMiddleware: ReturnType<typeof session> | null = null;

function sessionSecret(): string {
  return resolveSessionSecret();
}

export function getSession() {
  if (sessionMiddleware) return sessionMiddleware;

  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
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
    secret: sessionSecret(),
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

/** Session + passport (required for isAuthenticated and login). */
export function applyPassportMiddleware(app: Express): void {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
}
