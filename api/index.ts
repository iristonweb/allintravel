import type { Express, Request, Response } from "express";
import { createApp } from "../server/createApp";

let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    const { app } = await createApp();
    appPromise = Promise.resolve(app);
  }
  return appPromise;
}

/** Vercel serverless entry — only /api and /uploads are rewritten here. */
export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req, res);
}
