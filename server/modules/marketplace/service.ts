import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { ensurePlatformSchema } from "../../platform-schema";
import type { IStorage } from "../../storage";
import type { Trip } from "@shared/schema";

const memStripe = new Map<string, { stripeAccountId: string; chargesEnabled: boolean }>();

export async function forkTripWithAttribution(
  storage: IStorage,
  sourceTripId: string,
  userId: string,
): Promise<Trip> {
  const { copyTripForUser } = await import("../../trip-features");
  const source = await storage.getTrip(sourceTripId);
  if (!source) throw new Error("Trip not found");

  const copy = await copyTripForUser(storage, sourceTripId, userId);
  const db = getDb();
  if (db) {
    await db.execute(sql`
      UPDATE trips
      SET forked_from_trip_id = ${sourceTripId},
          title = ${source.title + " (fork)"}
      WHERE id = ${copy.id}
    `);
  }
  const refreshed = (await storage.getTrip(copy.id)) ?? copy;
  return { ...refreshed, forkedFromTripId: sourceTripId } as Trip;
}

export async function setTripMarketplace(
  storage: IStorage,
  tripId: string,
  userId: string,
  priceCents: number,
  isForSale: boolean,
): Promise<Trip> {
  await ensurePlatformSchema();
  const trip = await storage.getTrip(tripId);
  if (!trip || trip.userId !== userId) throw new Error("Forbidden");

  const db = getDb();
  if (db) {
    await db.execute(sql`
      UPDATE trips SET price_cents = ${priceCents}, is_for_sale = ${isForSale}, updated_at = now()
      WHERE id = ${tripId}
    `);
  }
  const updated = (await storage.getTrip(tripId)) ?? trip;
  return { ...updated, priceCents, isForSale } as Trip;
}

export async function getStripeConnectStatus(userId: string) {
  await ensurePlatformSchema();
  const db = getDb();
  if (db) {
    const res = await db.execute(sql`
      SELECT stripe_account_id, charges_enabled, payouts_enabled
      FROM stripe_connect_accounts WHERE user_id = ${userId}
    `);
    const row = (res as unknown as { rows?: Record<string, unknown>[] }).rows?.[0];
    if (!row) return { connected: false as const };
    return {
      connected: true as const,
      stripeAccountId: String(row.stripe_account_id),
      chargesEnabled: Boolean(row.charges_enabled),
      payoutsEnabled: Boolean(row.payouts_enabled),
    };
  }
  const mem = memStripe.get(userId);
  if (!mem) return { connected: false as const };
  return { connected: true as const, ...mem, payoutsEnabled: false };
}

export async function createStripeConnectLink(
  userId: string,
  email: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<{ url: string; mock: boolean }> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    const mockId = `acct_mock_${userId.slice(0, 8)}`;
    const db = getDb();
    if (db) {
      await db.execute(sql`
        INSERT INTO stripe_connect_accounts (user_id, stripe_account_id, charges_enabled)
        VALUES (${userId}, ${mockId}, false)
        ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
      `);
    } else {
      memStripe.set(userId, { stripeAccountId: mockId, chargesEnabled: false });
    }
    return { url: `${returnUrl}?stripe=mock`, mock: true };
  }

  const accountRes = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      type: "express",
      email,
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
    }),
  });
  if (!accountRes.ok) throw new Error("Stripe account creation failed");
  const account = (await accountRes.json()) as { id: string };

  const db = getDb();
  if (db) {
    await db.execute(sql`
      INSERT INTO stripe_connect_accounts (user_id, stripe_account_id)
      VALUES (${userId}, ${account.id})
      ON CONFLICT (user_id) DO UPDATE SET stripe_account_id = ${account.id}, updated_at = now()
    `);
  }

  const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    }),
  });
  if (!linkRes.ok) throw new Error("Stripe onboarding link failed");
  const link = (await linkRes.json()) as { url: string };
  return { url: link.url, mock: false };
}

export async function purchaseTripRoute(
  storage: IStorage,
  tripId: string,
  buyerId: string,
): Promise<{ trip: Trip; checkoutUrl?: string }> {
  await ensurePlatformSchema();
  const trip = await storage.getTrip(tripId);
  if (!trip || !trip.isForSale || !trip.priceCents) throw new Error("Not for sale");

  const forked = await forkTripWithAttribution(storage, tripId, buyerId);
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return { trip: forked };
  }

  const sellerStripe = await getStripeConnectStatus(trip.userId);
  if (!sellerStripe.connected) throw new Error("Seller not connected");

  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${process.env.APP_URL ?? "http://localhost:5000"}/trips/${forked.id}?paid=1`,
    cancel_url: `${process.env.APP_URL ?? "http://localhost:5000"}/trips/${tripId}/public`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(trip.priceCents),
    "line_items[0][price_data][product_data][name]": trip.title,
    "line_items[0][quantity]": "1",
    "payment_intent_data[application_fee_amount]": String(Math.floor(trip.priceCents * 0.15)),
    "payment_intent_data[transfer_data[destination]": sellerStripe.stripeAccountId,
  });

  const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!sessionRes.ok) throw new Error("Checkout session failed");
  const session = (await sessionRes.json()) as { url: string };
  return { trip: forked, checkoutUrl: session.url };
}
