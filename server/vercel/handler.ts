import type { Express, Request, Response } from "express";
import { createApp } from "../createApp";

let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    const { app } = await createApp();
    appPromise = Promise.resolve(app);
  }
  return appPromise;
}

export const config = {
  maxDuration: 60,
};

function runExpress(app: Express, req: Request, res: Response): Promise<void> {
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

export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api] unhandled error:", detail);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal Server Error",
        detail,
        hint: "Check Vercel logs, DATABASE_URL, SESSION_SECRET, and npm run db:push.",
      });
    }
  }
}
