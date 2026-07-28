import "dotenv/config";
import { createServer, type Server } from "http";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { initAppStorage } from "./storage";
import { setupUploadRoutes } from "./upload";
import { setupPushRoutes } from "./push";
import { isProductionEnv } from "./security";
import { loadConfig, getConfig } from "./config";
import { setupObservability } from "./observability/middleware";
import { bootstrapFlags } from "./flags";
import { registerFlagRoutes } from "./flags/routes";
import { registerAitOutboxHandlers } from "./outbox/handlers";
import { startOutboxDispatcher, drainOutbox } from "./outbox";
import { log } from "./observability/logger";
import "./policy/post-policies";
import "./policy/chat-policies";
import "./policy/marketplace-policies";

const INIT_TIMEOUT_MS = 12_000;

export async function createApp(): Promise<{ app: Express; server: Server }> {
  loadConfig();
  const app = express();
  app.use(
    helmet({
      contentSecurityPolicy: isProductionEnv()
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "blob:", "https:"],
              mediaSrc: ["'self'", "blob:", "https:"],
              connectSrc: ["'self'", "https:", "wss:"],
              fontSrc: ["'self'", "data:", "https:"],
            },
          }
        : false,
    }),
  );
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  setupObservability(app);

  // Health check before heavy init (must respond even if DB is slow)
  app.get("/api/health", async (_req, res) => {
    let database = false;

    if (getConfig().databaseUrl) {
      try {
        const { getDb } = await import("./db");
        const db = getDb();
        if (db) {
          const { sql } = await import("drizzle-orm");
          await Promise.race([
            db.execute(sql`SELECT 1`),
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
          ]);
          database = true;
        }
      } catch {
        database = false;
      }
    }

    res.json({ ok: true, database });
  });

  await bootstrapFlags();
  registerAitOutboxHandlers();
  startOutboxDispatcher();

  let server: Server;
  try {
    server = await registerRoutes(app);
  } catch (error) {
    log.error("createApp.registerRoutes_failed", { err: String(error) });
    server = createServer(app);
  }

  registerFlagRoutes(app);

  // After setupAuth (inside registerRoutes) so isAuthenticated works on upload/push.
  setupUploadRoutes(app);
  setupPushRoutes(app);

  app.post("/api/internal/outbox/drain", async (req, res) => {
    const secret = process.env.OUTBOX_DRAIN_SECRET?.trim();
    if (secret && req.headers["x-outbox-secret"] !== secret) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!secret && isProductionEnv()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await drainOutbox();
    res.json(result);
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  const runStorageInit = () => {
    initAppStorage().catch((error) => {
      log.error("createApp.initAppStorage_failed", { err: String(error) });
    });
  };

  if (process.env.VERCEL) {
    runStorageInit();
  } else {
    try {
      await Promise.race([
        initAppStorage(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("initAppStorage timeout")), INIT_TIMEOUT_MS),
        ),
      ]);
    } catch (error) {
      log.error("createApp.initAppStorage_failed", { err: String(error) });
    }
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { status?: number; statusCode?: number; message?: string };
    const status = e.status || e.statusCode || 500;
    const message = e.message || "Internal Server Error";
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  const isVercel = Boolean(process.env.VERCEL);
  const isDev = process.env.NODE_ENV !== "production" && !isVercel;
  if (isDev) {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else if (!isVercel) {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  return { app, server };
}
