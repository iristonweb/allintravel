import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import type { IStorage } from "../../storage";
import { ensurePlatformSchema } from "../../platform-schema";

export type PassportStamp = {
  id: string;
  countryCode: string | null;
  countryName: string;
  cityName: string | null;
  tripId: string | null;
  visitedAt: string | null;
  source: string;
};

export type PassportPayload = {
  countriesCount: number;
  citiesCount: number;
  tripsCount: number;
  stamps: PassportStamp[];
  achievements: string[];
};

const memStamps = new Map<string, PassportStamp[]>();

function achievementIds(countries: number, cities: number, trips: number): string[] {
  const ids: string[] = [];
  if (countries >= 1) ids.push("explorer");
  if (countries >= 5) ids.push("globetrotter");
  if (countries >= 15) ids.push("world_citizen");
  if (cities >= 10) ids.push("city_hopper");
  if (trips >= 3) ids.push("route_builder");
  return ids;
}

/** Sync stamps from user's trips (destination field → country/city). */
export async function syncPassportFromTrips(storage: IStorage, userId: string): Promise<void> {
  await ensurePlatformSchema();
  const trips = await storage.getTrips({ userId, limit: 100 });
  const db = getDb();

  for (const trip of trips) {
    const dest = trip.destination.trim();
    if (!dest) continue;
    const parts = dest.split(",").map((s: string) => s.trim());
    const cityName = parts.length > 1 ? parts[0] : null;
    const countryName = parts.length > 1 ? parts[parts.length - 1] : parts[0];

    if (db) {
      await db.execute(sql`
        INSERT INTO user_passport_stamps (user_id, country_name, city_name, trip_id, source)
        VALUES (${userId}, ${countryName}, ${cityName}, ${trip.id}, 'trip')
        ON CONFLICT DO NOTHING
      `);
    } else {
      const list = memStamps.get(userId) ?? [];
      const exists = list.some(
        (s) => s.countryName === countryName && s.cityName === cityName && s.tripId === trip.id,
      );
      if (!exists) {
        list.push({
          id: `stamp-${trip.id}`,
          countryCode: null,
          countryName,
          cityName,
          tripId: trip.id,
          visitedAt: trip.endDate?.toISOString() ?? null,
          source: "trip",
        });
        memStamps.set(userId, list);
      }
    }
  }
}

export async function getPassportForUser(
  storage: IStorage,
  userId: string,
  sync = true,
): Promise<PassportPayload> {
  await ensurePlatformSchema();
  if (sync) await syncPassportFromTrips(storage, userId);

  const db = getDb();
  let stamps: PassportStamp[] = [];

  if (db) {
    const res = await db.execute(sql`
      SELECT id, country_code, country_name, city_name, trip_id, visited_at, source
      FROM user_passport_stamps
      WHERE user_id = ${userId}
      ORDER BY visited_at DESC NULLS LAST
    `);
    stamps = ((res as unknown as { rows?: Record<string, unknown>[] }).rows ?? []).map((r) => ({
      id: String(r.id),
      countryCode: r.country_code ? String(r.country_code) : null,
      countryName: String(r.country_name),
      cityName: r.city_name ? String(r.city_name) : null,
      tripId: r.trip_id ? String(r.trip_id) : null,
      visitedAt: r.visited_at ? new Date(String(r.visited_at)).toISOString() : null,
      source: String(r.source ?? "trip"),
    }));
  } else {
    stamps = memStamps.get(userId) ?? [];
  }

  const countries = new Set(stamps.map((s) => s.countryName.toLowerCase()));
  const cities = new Set(
    stamps.filter((s) => s.cityName).map((s) => `${s.cityName}|${s.countryName}`.toLowerCase()),
  );
  const tripIds = new Set(stamps.map((s) => s.tripId).filter(Boolean));

  return {
    countriesCount: countries.size,
    citiesCount: cities.size,
    tripsCount: tripIds.size,
    stamps,
    achievements: achievementIds(countries.size, cities.size, tripIds.size),
  };
}
