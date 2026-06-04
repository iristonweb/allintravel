import "dotenv/config";
import { createServer, type Server } from "http";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { initAppStorage } from "./storage";
import { setupUploadRoutes } from "./upload";
import { setupPushRoutes } from "./push";

const INIT_TIMEOUT_MS = 12_000;

export async function createApp(): Promise<{ app: Express; server: Server }> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Health check before heavy init (must respond even if DB is slow)
  app.get("/api/health", async (_req, res) => {
    let dbOk = false;
    let dbError: string | undefined;

    if (process.env.DATABASE_URL) {
      try {
        const { getDb } = await import("./db");
        const db = getDb();
        if (db) {
          const { sql } = await import("drizzle-orm");
          await Promise.race([
            db.execute(sql`SELECT 1`),
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
          ]);
          dbOk = true;
        }
      } catch (e) {
        dbError = e instanceof Error ? e.message : String(e);
      }
    }

    res.json({
      ok: true,
      vercel: Boolean(process.env.VERCEL),
      databaseUrl: Boolean(process.env.DATABASE_URL),
      database: dbOk,
      dbError,
      sessionSecret: Boolean(process.env.SESSION_SECRET),
    });
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson as Record<string, unknown>;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        console.log(logLine);
      }
    });

    next();
  });

  setupUploadRoutes(app);
  setupPushRoutes(app);

  let server: Server;
  try {
    server = await registerRoutes(app);
  } catch (error) {
    console.error("[createApp] registerRoutes failed:", error);
    server = createServer(app);
  }

  const runStorageInit = () => {
    initAppStorage().catch((error) => {
      console.error("[createApp] initAppStorage failed (continuing):", error);
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
      console.error("[createApp] initAppStorage failed (continuing):", error);
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
