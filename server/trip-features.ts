import { randomBytes } from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import type { IStorage } from "./storage";
import type { Trip, TripWaypointWithPlace } from "@shared/schema";
import { applyReferralCode } from "./ait/referral";

const memInvites = new Map<
  string,
  { tripId: string; referrerId: string; referralCode: string; useCount: number; createdAt: Date }
>();

export async function ensureTripFeatureSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.execute(sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trip_invites (
      token varchar(32) PRIMARY KEY,
      trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referral_code varchar(12),
      use_count integer NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `);
}

function newToken(): string {
  return randomBytes(16).toString("hex");
}

export type TripInviteInfo = {
  token: string;
  tripId: string;
  tripTitle: string;
  destination: string;
  referrerId: string;
  inviteUrl: string;
};

export async function createTripInviteLink(
  storage: IStorage,
  tripId: string,
  referrerId: string,
  referralCode: string,
  appUrl: string,
): Promise<TripInviteInfo> {
  await ensureTripFeatureSchema();
  const trip = await storage.getTrip(tripId);
  if (!trip) throw new Error("Trip not found");

  const token = newToken();
  const db = getDb();
  if (db) {
    await db.execute(sql`
      INSERT INTO trip_invites (token, trip_id, referrer_id, referral_code)
      VALUES (${token}, ${tripId}, ${referrerId}, ${referralCode})
    `);
  } else {
    memInvites.set(token, {
      tripId,
      referrerId,
      referralCode,
      useCount: 0,
      createdAt: new Date(),
    });
  }

  const base = appUrl.replace(/\/$/, "");
  return {
    token,
    tripId,
    tripTitle: trip.title,
    destination: trip.destination,
    referrerId,
    inviteUrl: `${base}/trips/join/${token}`,
  };
}

export async function resolveTripInvite(
  storage: IStorage,
  token: string,
): Promise<{ trip: Trip; referrerId: string; referralCode: string | null } | null> {
  await ensureTripFeatureSchema();
  const db = getDb();
  if (db) {
    const result = await db.execute(sql`
      SELECT trip_id, referrer_id, referral_code FROM trip_invites WHERE token = ${token}
    `);
    const row = (
      result as unknown as {
        rows?: { trip_id: string; referrer_id: string; referral_code: string | null }[];
      }
    ).rows?.[0];
    if (!row) return null;
    const trip = await storage.getTrip(row.trip_id);
    if (!trip) return null;
    return { trip, referrerId: row.referrer_id, referralCode: row.referral_code };
  }
  const mem = memInvites.get(token);
  if (!mem) return null;
  const trip = await storage.getTrip(mem.tripId);
  if (!trip) return null;
  return { trip, referrerId: mem.referrerId, referralCode: mem.referralCode };
}

export async function consumeTripInvite(token: string): Promise<void> {
  const db = getDb();
  if (db) {
    await db.execute(sql`
      UPDATE trip_invites SET use_count = use_count + 1 WHERE token = ${token}
    `);
    return;
  }
  const mem = memInvites.get(token);
  if (mem) mem.useCount += 1;
}

export async function joinTripViaInvite(
  storage: IStorage,
  token: string,
  userId: string,
): Promise<{ trip: Trip; referralApplied: boolean }> {
  const resolved = await resolveTripInvite(storage, token);
  if (!resolved) throw new Error("Invalid invite");
  const { trip, referralCode } = resolved;

  await storage.joinTrip(trip.id, userId);

  let referralApplied = false;
  if (referralCode) {
    try {
      const result = await applyReferralCode(userId, referralCode);
      referralApplied = Boolean(result.ok);
    } catch {
      /* already used or self-referral */
    }
  }

  await consumeTripInvite(token);
  const refreshed = (await storage.getTrip(trip.id)) ?? trip;
  return { trip: refreshed, referralApplied };
}

export async function copyTripForUser(
  storage: IStorage,
  sourceTripId: string,
  userId: string,
): Promise<Trip> {
  const source = await storage.getTrip(sourceTripId);
  if (!source) throw new Error("Trip not found");
  if (!source.isPublic && source.userId !== userId) {
    const isMember = await storage.isTripParticipant(sourceTripId, userId);
    if (!isMember) throw new Error("Forbidden");
  }

  const waypoints = await storage.getTripWaypoints(sourceTripId);
  const copy = await storage.createTrip({
    userId,
    title: `${source.title} (копия)`,
    description: source.description,
    destination: source.destination,
    startDate: source.startDate,
    endDate: source.endDate,
    maxParticipants: source.maxParticipants ?? 5,
    budgetMin: source.budgetMin,
    budgetMax: source.budgetMax,
    plannerNotes: source.plannerNotes,
    imageUrl: source.imageUrl,
    isPublic: false,
    isActive: true,
  });

  const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  for (const wp of sorted) {
    await storage.addTripWaypoint(copy.id, wp.placeId, wp.orderIndex, wp.dayNumber ?? undefined);
  }

  const { ensureTripChatRoom } = await import("./trip-hub");
  return ensureTripChatRoom(storage, copy);
}

export async function getPlannableTrips(storage: IStorage, userId: string): Promise<Trip[]> {
  const owned = await storage.getTrips({ userId, limit: 50 });
  const tripIds = await storage.getTripParticipationsByUser(userId);
  const seen = new Set(owned.map((t) => t.id));
  const extra: Trip[] = [];
  for (const id of tripIds) {
    if (seen.has(id)) continue;
    const t = await storage.getTrip(id);
    if (t) {
      extra.push(t);
      seen.add(id);
    }
  }
  return [...owned, ...extra].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}

export type PublicTripPayload = {
  trip: Trip;
  waypoints: TripWaypointWithPlace[];
  stopCount: number;
};

export async function getPublicTripPayload(
  storage: IStorage,
  tripId: string,
): Promise<PublicTripPayload | null> {
  const trip = await storage.getTrip(tripId);
  if (!trip || !trip.isPublic) return null;
  const waypoints = await storage.getTripWaypoints(tripId);
  return { trip, waypoints, stopCount: waypoints.length };
}
