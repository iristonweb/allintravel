import { isDatabaseConfigured } from "./db";
import { isProductionEnv } from "./security";

const CLIENT_AUTH_CODES = new Set([
  "NO_DATABASE",
  "NO_SESSION_SECRET",
  "SCHEMA",
  "DB_CONNECT",
  "SESSION",
]);

export function isSessionConfigured(): boolean {
  const secret = process.env.SESSION_SECRET?.trim();
  if (isProductionEnv()) {
    return Boolean(secret && secret.length >= 32);
  }
  return true;
}

export function clientAuthErrorCode(code?: string): string {
  if (code && CLIENT_AUTH_CODES.has(code)) return code;
  return "SERVER";
}

export function publicAuthErrorMessage(code: string, devDetail?: string): string {
  switch (code) {
    case "NO_DATABASE":
      return "База данных не подключена. В Vercel → Environment Variables добавьте DATABASE_URL (Neon) и redeploy.";
    case "NO_SESSION_SECRET":
      return "SESSION_SECRET не задан или короче 32 символов. Добавьте случайную строку в Vercel и redeploy.";
    case "SCHEMA":
      return "Схема БД не готова. Подключите production DATABASE_URL локально и выполните npm run db:migrate.";
    case "DB_CONNECT":
      return "Не удалось подключиться к базе. Проверьте DATABASE_URL и доступ Neon.";
    case "SESSION":
      return "Не удалось сохранить сессию. Убедитесь, что таблица sessions создана (npm run db:migrate).";
    default:
      return isProductionEnv()
        ? "Временная ошибка сервера. Попробуйте позже."
        : (devDetail ?? "Unknown error");
  }
}

/** Warm DB schema + AIT before login on Vercel auth-app (bypasses full createApp). */
export async function ensureAuthInfrastructure(): Promise<void> {
  if (!isSessionConfigured()) {
    throw Object.assign(new Error("NO_SESSION_SECRET"), { code: "NO_SESSION_SECRET" });
  }
  if (!isDatabaseConfigured()) return;

  const { storage } = await import("./storage");
  if (storage.ensureSchema) {
    await storage.ensureSchema();
  }
  const { ensureAitReady } = await import("./ait/service");
  await ensureAitReady();
}

export function authConfigPayload() {
  return {
    /** First login with email + password creates the account (no separate signup page). */
    emailSignup: true,
    databaseConfigured: isDatabaseConfigured(),
    sessionConfigured: isSessionConfigured(),
  };
}
