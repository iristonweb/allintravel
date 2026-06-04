import type { Express, Request, Response } from "express";
import webpush from "web-push";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";

type PushSubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function setupPushRoutes(app: Express): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@allintravel.app";

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: publicKey ?? null, enabled: Boolean(publicKey && privateKey) });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.claims.sub;
    const sub = req.body as PushSubscriptionBody;
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    await storage.upsertPushSubscription(userId, sub);
    res.status(201).json({ ok: true });
  });

  app.delete("/api/push/subscribe", isAuthenticated, async (req: any, res: Response) => {
    const endpoint = String(req.body?.endpoint ?? "");
    if (endpoint) await storage.deletePushSubscription(endpoint);
    res.status(204).send();
  });

  app.post("/api/push/test", isAuthenticated, async (req: any, res: Response) => {
    if (!publicKey || !privateKey) {
      return res.status(503).json({ message: "Push not configured (VAPID keys)" });
    }
    const userId = req.user.claims.sub;
    try {
      await sendPushToUser(userId, {
        title: "All In Travel",
        body: "Push-уведомления работают!",
        url: "/profile/settings",
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("Push test error:", err);
      res.status(500).json({ message: "Failed to send push — проверьте подписку в браузере" });
    }
  });
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  const subs = await storage.getPushSubscriptionsForUser(userId);
  if (!subs.length) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          } as Parameters<typeof webpush.sendNotification>[0],
          data,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await storage.deletePushSubscription(sub.endpoint);
        }
        console.error("Push send failed:", err);
      }
    }),
  );
}
