import express, { type Express, type Request, type Response } from "express";
import { applyPassportMiddleware } from "../auth";
import { mountUploadRoutes } from "../upload";

/** Lightweight app for uploads — avoids full createApp cold start on Vercel. */
let uploadApp: Express | null = null;

export function getMediaUploadApp(): Express {
  if (uploadApp) return uploadApp;

  const app = express();
  app.set("trust proxy", 1);
  applyPassportMiddleware(app);
  mountUploadRoutes(app, { serveStatic: false });

  uploadApp = app;
  return app;
}

export function isMediaUploadPath(method: string | undefined, url: string | undefined): boolean {
  if (method !== "POST" || !url) return false;
  const path = url.split("?")[0] ?? "";
  if (path === "/api/upload" || path === "/api/users/avatar") return true;
  return /^\/api\/chat\/rooms\/[^/]+\/avatar$/.test(path);
}

export function runMediaUploadApp(req: Request, res: Response): Promise<void> {
  const app = getMediaUploadApp();
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    res.once("finish", done);
    res.once("close", done);
    res.once("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    try {
      app(req, res, (err: unknown) => {
        if (err && !settled) {
          settled = true;
          reject(err);
        }
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        reject(err);
      }
    }
  });
}
