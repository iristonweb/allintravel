import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, Request } from "express";
import { storage } from "./storage";
import { isDatabaseConfigured } from "./db";
import { hashPassword, isPasswordLongEnough, verifyPassword } from "./password";
import { resolveIsAdmin } from "./admin";
import { toSessionUser, type SessionUser } from "./auth-session";
import { authLoginLimiter } from "./rate-limit";
import { clientAuthErrorCode, publicAuthErrorMessage } from "./auth-readiness";

async function syncAdminRole(user: NonNullable<Awaited<ReturnType<typeof storage.getUser>>>) {
  if (!resolveIsAdmin(user.email) || user.isAdmin) return user;
  return storage.setUserAdmin(user.id, true);
}

let schemaReady: Promise<void> | null = null;

export async function ensureAuthSchema(): Promise<void> {
  if (!storage.ensureSchema) return;
  if (!schemaReady) {
    schemaReady = storage.ensureSchema().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
}

export type LocalAuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "error"; message: string; code?: string };

export async function authenticateLocal(email: string, password: string): Promise<LocalAuthResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, reason: "invalid" };
  }
  if (!isPasswordLongEnough(password)) {
    return { ok: false, reason: "invalid" };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      reason: "error",
      message: "База данных не подключена (DATABASE_URL на Vercel)",
      code: "NO_DATABASE",
    };
  }

  try {
    await ensureAuthSchema();

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
      return { ok: true, user: toSessionUser(user) };
    }

    if (!user.passwordHash) {
      const passwordHash = await hashPassword(password);
      user = await storage.setUserPassword(user.id, passwordHash);
      user = await syncAdminRole(user);
      return { ok: true, user: toSessionUser(user) };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { ok: false, reason: "invalid" };
    }

    user = await syncAdminRole(user);
    return { ok: true, user: toSessionUser(user) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth] authenticateLocal:", message);
    const code =
      message.includes("password_hash") || message.includes("column")
        ? "SCHEMA"
        : message.includes("relation") && message.includes("does not exist")
          ? "SCHEMA"
          : message.includes("connect") ||
              message.includes("timeout") ||
              message.includes("ECONNREFUSED")
            ? "DB_CONNECT"
            : "UNKNOWN";
    return { ok: false, reason: "error", message, code };
  }
}

let localStrategyReady = false;

export function registerLocalPassportStrategy(): void {
  if (localStrategyReady) return;
  localStrategyReady = true;

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        const result = await authenticateLocal(String(email ?? ""), String(password ?? ""));
        if (result.ok) return done(null, result.user);
        if (result.reason === "invalid") {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(new Error(result.message));
      },
    ),
  );
}

function safeRedirect(raw: string | undefined): string {
  const r = raw ?? "/";
  return r.startsWith("/") && !r.startsWith("//") && !r.includes("://") ? r : "/";
}

function promisifyLogin(req: Request, user: SessionUser): Promise<void> {
  return new Promise((resolve, reject) => {
    req.logIn(user, (err) => (err ? reject(err) : resolve()));
  });
}

export function registerLoginRoutes(app: Express): void {
  app.get("/api/login", (_req, res) => {
    res.redirect("/login");
  });

  app.post("/api/auth/login", authLoginLimiter, async (req, res) => {
    const email = String(req.body?.email ?? "").trim();
    const password = String(req.body?.password ?? "");
    const redirectTo = safeRedirect(
      typeof req.body?.redirect === "string" ? req.body.redirect : undefined,
    );

    const result = await authenticateLocal(email, password);
    if (!result.ok) {
      if (result.reason === "invalid") {
        return res
          .status(401)
          .json({ ok: false, error: "invalid", message: "Неверный email или пароль" });
      }
      return res.status(result.code === "NO_DATABASE" ? 503 : 500).json({
        ok: false,
        error: "server",
        code: clientAuthErrorCode(result.code),
        message: publicAuthErrorMessage(clientAuthErrorCode(result.code), result.message),
      });
    }

    try {
      await promisifyLogin(req, result.user);
      return res.json({ ok: true, redirect: redirectTo });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[auth] session save failed:", message);
      return res.status(500).json({
        ok: false,
        error: "server",
        code: "SESSION",
        message: publicAuthErrorMessage("SESSION", message),
      });
    }
  });

  app.post("/api/login", authLoginLimiter, (req, res, next) => {
    const redirectTo = safeRedirect(
      typeof req.query.redirect === "string" ? req.query.redirect : "/",
    );

    passport.authenticate("local", (err: unknown, user: Express.User | false | null) => {
      if (err) {
        console.error("[auth] POST /api/login authenticate:", err);
        const q = new URLSearchParams({ error: "server" });
        if (redirectTo !== "/") q.set("redirect", redirectTo);
        return res.redirect(`/login?${q.toString()}`);
      }
      if (!user) {
        const q = new URLSearchParams({ error: "invalid" });
        if (redirectTo !== "/") q.set("redirect", redirectTo);
        return res.redirect(`/login?${q.toString()}`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("[auth] session save failed:", loginErr);
          const q = new URLSearchParams({ error: "server" });
          if (redirectTo !== "/") q.set("redirect", redirectTo);
          return res.redirect(`/login?${q.toString()}`);
        }
        return res.redirect(redirectTo);
      });
    })(req, res, next);
  });
}
