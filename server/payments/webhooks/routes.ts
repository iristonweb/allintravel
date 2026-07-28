import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { getDb } from "../../db";
import { getConfig } from "../../config";
import { isEnabled } from "../../flags";
import { incr, MetricNames } from "../../observability/metrics";
import { log } from "../../observability/logger";
import { storage } from "../../storage";

type RawRequest = Request & { rawBody?: Buffer };

const memWebhookIds = new Set<string>();

async function recordWebhookEvent(
  id: string,
  provider: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const db = getDb();
  if (!db) {
    if (memWebhookIds.has(id)) return false;
    memWebhookIds.add(id);
    return true;
  }
  try {
    const res = await db.execute(sql`
      INSERT INTO payment_webhook_events (id, provider, event_type, payload)
      VALUES (${id}, ${provider}, ${eventType}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `);
    return Boolean((res as unknown as { rows?: unknown[] }).rows?.length);
  } catch (err) {
    log.warn("payments.webhook_record_failed", { err: String(err) });
    // Migration may not be applied yet — use in-memory idempotency
    if (memWebhookIds.has(id)) return false;
    memWebhookIds.add(id);
    return true;
  }
}

async function markWebhookProcessed(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.execute(sql`
      UPDATE payment_webhook_events SET processed_at = now() WHERE id = ${id}
    `);
  } catch (err) {
    log.warn("payments.webhook_mark_failed", { err: String(err) });
  }
}

function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;
  const signed = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

async function fulfillMarketplacePurchase(metadata: Record<string, unknown>): Promise<void> {
  const tripId = String(metadata.tripId ?? metadata.trip_id ?? "");
  const buyerId = String(metadata.buyerId ?? metadata.buyer_id ?? metadata.userId ?? "");
  if (!tripId || !buyerId) return;

  const trip = await storage.getTrip(tripId);
  if (!trip) return;

  // Licensed fork already created at checkout start in legacy flow;
  // webhook confirms settlement and records audit attribution.
  const db = getDb();
  if (db) {
    await db.execute(sql`
      INSERT INTO audit_log (id, actor_user_id, action, resource_type, resource_id, metadata)
      VALUES (
        ${`aud-${Date.now().toString(36)}`},
        ${buyerId},
        ${"marketplace.purchase_settled"},
        ${"trip"},
        ${tripId},
        ${JSON.stringify({ priceCents: trip.priceCents ?? 0 })}::jsonb
      )
    `);
  }

  const { recordMarketplaceBurnFromFee } = await import("../../ait/burns");
  if (trip.priceCents) {
    await recordMarketplaceBurnFromFee({
      priceCents: trip.priceCents,
      userId: buyerId,
      tripId,
    }).catch((err) => log.warn("payments.marketplace_burn", { err: String(err) }));
  }
}

async function fulfillEventRegistration(metadata: Record<string, unknown>): Promise<void> {
  const eventId = String(metadata.eventId ?? "");
  const userId = String(metadata.userId ?? "");
  if (!eventId || !userId) return;
  try {
    await storage.registerForEvent(eventId, userId);
  } catch (err) {
    log.warn("payments.event_register", { err: String(err) });
  }
}

export function registerPaymentWebhookRoutes(app: Express): void {
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    if (!(await isEnabled("payments_webhooks"))) {
      return res.status(503).json({ message: "Webhooks disabled" });
    }
    const cfg = getConfig();
    const secret = cfg.stripeWebhookSecret;
    const raw = (req as RawRequest).rawBody;
    if (!secret || !raw) {
      return res.status(400).json({ message: "Missing webhook secret or body" });
    }
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!verifyStripeSignature(raw, sig, secret)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body as {
      id?: string;
      type?: string;
      data?: { object?: Record<string, unknown> };
    };
    const eventId = String(event.id ?? "");
    const eventType = String(event.type ?? "unknown");
    if (!eventId) return res.status(400).json({ message: "Missing event id" });

    const fresh = await recordWebhookEvent(
      eventId,
      "stripe",
      eventType,
      event as Record<string, unknown>,
    );
    incr(MetricNames.paymentWebhooks);
    if (!fresh) return res.json({ received: true, duplicate: true });

    try {
      if (eventType === "checkout.session.completed") {
        const obj = event.data?.object ?? {};
        const metadata = (obj.metadata ?? {}) as Record<string, unknown>;
        await fulfillMarketplacePurchase(metadata);
      }
      await markWebhookProcessed(eventId);
      res.json({ received: true });
    } catch (err) {
      log.error("payments.stripe_webhook_failed", { err: String(err) });
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/yookassa", async (req: Request, res: Response) => {
    if (!(await isEnabled("payments_webhooks"))) {
      return res.status(503).json({ message: "Webhooks disabled" });
    }
    const cfg = getConfig();
    // YooKassa IP allowlisting / secret header — fail closed when secret configured
    const expected = cfg.yukassaWebhookSecret;
    if (expected) {
      const provided = String(
        req.headers["x-yookassa-signature"] ?? req.headers["authorization"] ?? "",
      );
      if (provided !== expected) {
        return res.status(401).json({ message: "Invalid signature" });
      }
    } else if (cfg.isProduction) {
      return res.status(401).json({ message: "Webhook secret required in production" });
    }

    const body = req.body as {
      event?: string;
      object?: { id?: string; status?: string; metadata?: Record<string, unknown> };
    };
    const paymentId = String(body.object?.id ?? "");
    const eventType = String(body.event ?? "unknown");
    if (!paymentId) return res.status(400).json({ message: "Missing payment id" });

    const eventId = `yookassa:${paymentId}:${eventType}`;
    const fresh = await recordWebhookEvent(
      eventId,
      "yookassa",
      eventType,
      body as Record<string, unknown>,
    );
    incr(MetricNames.paymentWebhooks);
    if (!fresh) return res.json({ received: true, duplicate: true });

    try {
      if (eventType === "payment.succeeded" && body.object?.status === "succeeded") {
        await fulfillEventRegistration(body.object.metadata ?? {});
      }
      await markWebhookProcessed(eventId);
      res.json({ received: true });
    } catch (err) {
      log.error("payments.yookassa_webhook_failed", { err: String(err) });
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
}
