import type { Express, Request, Response } from "express";
import { createApp } from "../createApp";
import { isAuthLoginPath, runAuthApp } from "./auth-app";
import { isMediaUploadPath, runMediaUploadApp } from "./media-upload-app";

let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    const { app } = await createApp();
    appPromise = Promise.resolve(app);
  }
  return appPromise;
}

/** Vercel reads this from the built api/index.js */
export const config = {
  maxDuration: 60,
  memory: 1024,
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
    if (process.env.VERCEL && isAuthLoginPath(req.method, req.url)) {
      await runAuthApp(req, res);
      return;
    }
    if (process.env.VERCEL && isMediaUploadPath(req.method, req.url)) {
      await runMediaUploadApp(req, res);
      return;
    }

    const app = await getApp();
    await runExpress(app, req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api] unhandled error:", detail);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
