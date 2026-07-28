import { z } from "zod";

const boolFromEnv = z
  .string()
  .optional()
  .transform((v) => {
    if (v == null || v === "") return undefined;
    return ["1", "true", "yes", "on"].includes(v.toLowerCase());
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().optional(),
  APP_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  ADMIN_EMAILS: z.string().optional().default(""),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  YUKASSA_SHOP_ID: z.string().optional(),
  YUKASSA_SECRET_KEY: z.string().optional(),
  YUKASSA_WEBHOOK_SECRET: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  /** Comma-separated overrides: key=true|false */
  FEATURE_FLAG_OVERRIDES: z.string().optional().default(""),

  FLAG_RUNTIME_DDL: boolFromEnv,
  FLAG_OUTBOX_DISPATCH: boolFromEnv,
  FLAG_AIT_DOUBLE_ENTRY: boolFromEnv,
  FLAG_PAYMENTS_WEBHOOKS: boolFromEnv,
  FLAG_AI_TOOL_PROPOSALS: boolFromEnv,
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  isVercel: boolean;
  isProduction: boolean;
  port: number;
  databaseUrl: string | undefined;
  sessionSecret: string | undefined;
  appUrl: string | undefined;
  adminEmails: string[];
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  yukassaShopId: string | undefined;
  yukassaSecretKey: string | undefined;
  yukassaWebhookSecret: string | undefined;
  openaiApiKey: string | undefined;
  redisUrl: string | undefined;
  telegramBotToken: string | undefined;
  featureFlagOverrides: Record<string, boolean>;
  envFlagDefaults: Partial<Record<string, boolean>>;
};

let cached: AppConfig | null = null;

function parseFlagOverrides(raw: string): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .toLowerCase();
    out[key] = ["1", "true", "yes", "on"].includes(val);
  }
  return out;
}

/** Parse and validate process.env. Safe in test/dev; fail-closed in production for SESSION_SECRET. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration: ${msg}`);
  }
  const e = parsed.data;
  const isVercel = Boolean(e.VERCEL);
  const isProduction = e.NODE_ENV === "production" || isVercel;

  if (isProduction && e.NODE_ENV !== "test") {
    const secret = e.SESSION_SECRET?.trim();
    if (!secret || secret.length < 32) {
      throw new Error(
        "SESSION_SECRET must be set to a random string of at least 32 characters in production",
      );
    }
  }

  const config: AppConfig = {
    nodeEnv: e.NODE_ENV,
    isVercel,
    isProduction,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL?.trim() || undefined,
    sessionSecret: e.SESSION_SECRET?.trim() || undefined,
    appUrl: e.APP_URL?.trim() || undefined,
    adminEmails: (e.ADMIN_EMAILS ?? "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
    googleClientId: e.GOOGLE_CLIENT_ID?.trim() || undefined,
    googleClientSecret: e.GOOGLE_CLIENT_SECRET?.trim() || undefined,
    stripeSecretKey: e.STRIPE_SECRET_KEY?.trim() || undefined,
    stripeWebhookSecret: e.STRIPE_WEBHOOK_SECRET?.trim() || undefined,
    yukassaShopId: e.YUKASSA_SHOP_ID?.trim() || undefined,
    yukassaSecretKey: e.YUKASSA_SECRET_KEY?.trim() || undefined,
    yukassaWebhookSecret: e.YUKASSA_WEBHOOK_SECRET?.trim() || undefined,
    openaiApiKey: e.OPENAI_API_KEY?.trim() || undefined,
    redisUrl: e.REDIS_URL?.trim() || undefined,
    telegramBotToken: e.TELEGRAM_BOT_TOKEN?.trim() || undefined,
    featureFlagOverrides: parseFlagOverrides(e.FEATURE_FLAG_OVERRIDES ?? ""),
    envFlagDefaults: {
      runtime_ddl: e.FLAG_RUNTIME_DDL,
      outbox_dispatch: e.FLAG_OUTBOX_DISPATCH,
      ait_double_entry: e.FLAG_AIT_DOUBLE_ENTRY,
      payments_webhooks: e.FLAG_PAYMENTS_WEBHOOKS,
      ai_tool_proposals: e.FLAG_AI_TOOL_PROPOSALS,
    },
  };
  cached = config;
  return config;
}

export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}

/** Test helper — reset cached config. */
export function resetConfigCache(): void {
  cached = null;
}
