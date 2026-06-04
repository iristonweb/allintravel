import "dotenv/config";
import type { Server } from "http";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { initAppStorage } from "./storage";
import { setupUploadRoutes } from "./upload";
import { setupPushRoutes } from "./push";
import { setupVite, serveStatic } from "./vite";

export async function createApp(): Promise<{ app: Express; server: Server }> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

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

  await initAppStorage();
  setupUploadRoutes(app);
  setupPushRoutes(app);
  const server = await registerRoutes(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { status?: number; statusCode?: number; message?: string };
    const status = e.status || e.statusCode || 500;
    const message = e.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const isDev = process.env.NODE_ENV !== "production" && !process.env.VERCEL;
  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return { app, server };
}
