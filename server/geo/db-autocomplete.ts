import { getDb } from "../db";
import { cities, countries } from "@shared/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";

export type DbGeoAutocompleteItem =
  | {
      kind: "country";
      label: string;
      countryCode: string;
    }
  | {
      kind: "city";
      label: string;
      geonameId: number;
      countryCode: string;
      lat: number;
      lon: number;
      city: string;
      country: string;
      population: number;
    };

function clampLimit(limit: number) {
  return Math.max(1, Math.min(10, Math.floor(limit)));
}

export async function dbGeoAutocomplete(params: {
  q: string;
  limit?: number;
  scope?: "city" | "country" | "all";
}): Promise<DbGeoAutocompleteItem[]> {
  const db = getDb();
  if (!db) return [];

  const q = params.q.trim();
  const limit = clampLimit(params.limit ?? 8);
  const scope = params.scope ?? "all";

  const pattern = `%${q}%`;

  const results: DbGeoAutocompleteItem[] = [];

  if (scope === "country" || scope === "all") {
    const rows = await db
      .select({
        code: countries.code,
        name: countries.name,
      })
      .from(countries)
      .where(or(ilike(countries.name, pattern), ilike(countries.code, q.toUpperCase())))
      .limit(limit);

    for (const r of rows) {
      results.push({
        kind: "country",
        label: r.name,
        countryCode: r.code,
      });
    }
  }

  const remaining = scope === "all" ? Math.max(0, limit - results.length) : limit;

  if ((scope === "city" || scope === "all") && remaining > 0) {
    const cityRows = await db
      .select({
        geonameId: cities.geonameId,
        name: cities.name,
        asciiName: cities.asciiName,
        countryCode: cities.countryCode,
        latitude: cities.latitude,
        longitude: cities.longitude,
        population: cities.population,
        countryName: countries.name,
      })
      .from(cities)
      .leftJoin(countries, eq(cities.countryCode, countries.code))
      .where(
        and(
          or(ilike(cities.name, pattern), ilike(cities.asciiName, pattern)),
          // keep only valid country codes
          ilike(cities.countryCode, "__"),
        ),
      )
      .orderBy(desc(cities.population), cities.name)
      .limit(remaining);

    for (const r of cityRows) {
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      const population = r.population ?? 0;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const countryName = r.countryName ?? r.countryCode;
      results.push({
        kind: "city",
        label: `${r.name}, ${countryName}`,
        geonameId: r.geonameId,
        countryCode: r.countryCode,
        lat,
        lon,
        city: r.name,
        country: countryName,
        population,
      });
    }
  }

  return results.slice(0, limit);
}

