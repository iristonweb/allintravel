import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { ensurePlatformSchema } from "../../platform-schema";
import type { IStorage } from "../../storage";

export type TrustProfile = {
  userId: string;
  score: number;
  tripCount: number;
  reviewCount: number;
  vouchCount: number;
  isVerified: boolean;
};

const memTrust = new Map<string, TrustProfile>();
const memVouches = new Map<string, Set<string>>();

function computeScore(row: TrustProfile): number {
  return Math.min(
    100,
    Math.max(
      0,
      50 +
        row.tripCount * 3 +
        row.reviewCount * 2 +
        row.vouchCount * 5 +
        (row.isVerified ? 10 : 0),
    ),
  );
}

export async function ensureTrustRow(userId: string): Promise<TrustProfile> {
  await ensurePlatformSchema();
  const db = getDb();

  if (db) {
    await db.execute(sql`
      INSERT INTO user_trust_scores (user_id) VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `);
    const res = await db.execute(sql`
      SELECT user_id, score, trip_count, review_count, vouch_count, is_verified
      FROM user_trust_scores WHERE user_id = ${userId}
    `);
    const row = (res as unknown as { rows?: Record<string, unknown>[] }).rows?.[0];
    if (row) {
      return {
        userId,
        score: Number(row.score),
        tripCount: Number(row.trip_count),
        reviewCount: Number(row.review_count),
        vouchCount: Number(row.vouch_count),
        isVerified: Boolean(row.is_verified),
      };
    }
  }

  let profile = memTrust.get(userId);
  if (!profile) {
    profile = {
      userId,
      score: 50,
      tripCount: 0,
      reviewCount: 0,
      vouchCount: 0,
      isVerified: false,
    };
    memTrust.set(userId, profile);
  }
  return profile;
}

export async function recalculateTrust(storage: IStorage, userId: string): Promise<TrustProfile> {
  const trips = await storage.getTrips({ userId, limit: 200 });
  const reviews = await storage.getReviewsByUser(userId);
  const reviewCount = reviews?.length ?? 0;
  const base = await ensureTrustRow(userId);
  const updated: TrustProfile = {
    ...base,
    tripCount: trips.length,
    reviewCount,
    isVerified: base.isVerified || (base.vouchCount >= 3 && trips.length >= 2),
  };
  updated.score = computeScore(updated);

  const db = getDb();
  if (db) {
    await db.execute(sql`
      UPDATE user_trust_scores
      SET trip_count = ${updated.tripCount},
          review_count = ${updated.reviewCount},
          vouch_count = ${updated.vouchCount},
          is_verified = ${updated.isVerified},
          score = ${updated.score},
          updated_at = now()
      WHERE user_id = ${userId}
    `);
  } else {
    memTrust.set(userId, updated);
  }
  return updated;
}

export async function getTrustProfile(
  storage: IStorage,
  userId: string,
): Promise<TrustProfile> {
  await recalculateTrust(storage, userId);
  return ensureTrustRow(userId);
}

export async function addVouch(
  fromUserId: string,
  toUserId: string,
  message?: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (fromUserId === toUserId) return { ok: false, reason: "self" };
  await ensurePlatformSchema();
  const db = getDb();

  if (db) {
    try {
      await db.execute(sql`
        INSERT INTO user_vouches (from_user_id, to_user_id, message)
        VALUES (${fromUserId}, ${toUserId}, ${message ?? null})
      `);
      await db.execute(sql`
        UPDATE user_trust_scores
        SET vouch_count = vouch_count + 1, updated_at = now()
        WHERE user_id = ${toUserId}
      `);
      return { ok: true };
    } catch {
      return { ok: false, reason: "duplicate" };
    }
  }

  const key = toUserId;
  const set = memVouches.get(key) ?? new Set();
  if (set.has(fromUserId)) return { ok: false, reason: "duplicate" };
  set.add(fromUserId);
  memVouches.set(key, set);
  const profile = await ensureTrustRow(toUserId);
  profile.vouchCount += 1;
  profile.score = computeScore(profile);
  memTrust.set(toUserId, profile);
  return { ok: true };
}

export async function hasVouched(fromUserId: string, toUserId: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    const res = await db.execute(sql`
      SELECT 1 FROM user_vouches WHERE from_user_id = ${fromUserId} AND to_user_id = ${toUserId}
    `);
    return Boolean((res as unknown as { rows?: unknown[] }).rows?.length);
  }
  return memVouches.get(toUserId)?.has(fromUserId) ?? false;
}
