import type { Express, Request, Response } from "express";
import webpush from "web-push";
import { isAuthenticated } from "./auth";

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const subscriptions = new Map<string, PushSubscription>();

export function setupPushRoutes(app: Express): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@allintravel.app";

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: publicKey ?? null });
  });

  app.post("/api/push/subscribe", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user.claims.sub;
    const sub = req.body as PushSubscription;
    if (!sub?.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    subscriptions.set(userId, sub);
    res.status(201).json({ ok: true });
  });

  app.post("/api/push/test", isAuthenticated, async (req: any, res: Response) => {
    if (!publicKey || !privateKey) {
      return res.status(503).json({ message: "Push not configured" });
    }
    const userId = req.user.claims.sub;
    const sub = subscriptions.get(userId);
    if (!sub) {
      return res.status(404).json({ message: "No subscription" });
    }
    try {
      await webpush.sendNotification(
        sub as unknown as Parameters<typeof webpush.sendNotification>[0],
        JSON.stringify({ title: "All In Travel", body: "Уведомления работают!" }),
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("Push error:", err);
      res.status(500).json({ message: "Failed to send push" });
    }
  });
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string }): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  const sub = subscriptions.get(userId);
  if (!sub) return;
  await webpush.sendNotification(
    sub as unknown as Parameters<typeof webpush.sendNotification>[0],
    JSON.stringify(payload),
  );
}
