import express, { type Express, type Request, type Response } from "express";
import { applyPassportMiddleware } from "../auth-middleware";
import { registerLocalPassportStrategy, registerLoginRoutes } from "../local-auth";

let authApp: Express | null = null;

export function getAuthApp(): Express {
  if (authApp) return authApp;

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  applyPassportMiddleware(app);
  registerLocalPassportStrategy();
  registerLoginRoutes(app);

  authApp = app;
  return app;
}

export function isAuthLoginPath(method: string | undefined, url: string | undefined): boolean {
  if (method !== "POST" || !url) return false;
  const path = url.split("?")[0] ?? "";
  return path === "/api/login" || path === "/api/auth/login";
}

export function runAuthApp(req: Request, res: Response): Promise<void> {
  const app = getAuthApp();
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
