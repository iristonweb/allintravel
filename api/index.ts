import type { Express } from "express";
import { createApp } from "../server/createApp";

let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    const { app } = await createApp();
    appPromise = Promise.resolve(app);
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
