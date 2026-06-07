import type { GeoAutocompleteItem } from "./nominatim";
import { nominatimAutocomplete } from "./nominatim";
import { photonAutocomplete } from "./photon";
import { isAnyYandexGeoConfigured } from "./yandex-config";
import { yandexAutocomplete } from "./yandex";
import { dbGeoAutocomplete } from "./db-autocomplete";
import { sortGeoAutocompleteResults } from "./geo-sort";

function clampLimit(limit: number) {
  return Math.max(1, Math.min(15, Math.floor(limit)));
}

function labelKey(item: GeoAutocompleteItem): string {
  return item.label.trim().toLowerCase();
}

function mergeUnique(target: GeoAutocompleteItem[], incoming: GeoAutocompleteItem[], max: number) {
  const seen = new Set(target.map(labelKey));
  for (const item of incoming) {
    if (target.length >= max) break;
    const key = labelKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    target.push(item);
  }
}

function dbItemToGeo(
  item: Awaited<ReturnType<typeof dbGeoAutocomplete>>[number],
): GeoAutocompleteItem {
  if (item.kind === "country") {
    return {
      kind: "country",
      label: item.label,
      countryCode: item.countryCode,
      country: item.label,
    };
  }
  return {
    kind: "city",
    label: item.label,
    geonameId: item.geonameId,
    countryCode: item.countryCode,
    lat: item.lat,
    lon: item.lon,
    city: item.city,
    country: item.country,
    population: item.population,
  };
}

/**
 * GeoNames DB (cities/countries) + free OSM (Photon, Nominatim) + optional Yandex.
 * scope=full — приоритет адресов и POI (улицы, заведения, достопримечательности).
 */
export async function resolveGeoAutocomplete(params: {
  q: string;
  limit?: number;
  scope?: "city" | "country" | "all" | "full";
  acceptLanguage?: string | null;
}): Promise<GeoAutocompleteItem[]> {
  const q = params.q.trim();
  const limit = clampLimit(params.limit ?? 10);
  const scope = params.scope ?? "all";
  const lang = params.acceptLanguage ?? "ru";
  const results: GeoAutocompleteItem[] = [];
  const remaining = () => Math.max(0, limit - results.length);

  const useFull = scope === "full" || scope === "all";

  if (useFull && remaining() > 0) {
    try {
      const photon = await photonAutocomplete({ q, limit: remaining(), lang });
      mergeUnique(results, photon, limit);
    } catch (e) {
      console.warn("Photon autocomplete failed.", e);
    }
  }

  if (remaining() > 0 && isAnyYandexGeoConfigured()) {
    try {
      const ya = await yandexAutocomplete({ q, limit: remaining(), acceptLanguage: lang });
      mergeUnique(
        results,
        ya.map((item) => ({ ...item, kind: item.kind ?? "address" })),
        limit,
      );
    } catch (e) {
      console.warn("Yandex autocomplete failed.", e);
    }
  }

  if (useFull && remaining() > 0) {
    try {
      const nom = await nominatimAutocomplete({ q, limit: remaining(), acceptLanguage: lang });
      mergeUnique(results, nom, limit);
    } catch (e) {
      console.warn("Nominatim autocomplete failed.", e);
    }
  }

  if (process.env.DATABASE_URL && remaining() > 0) {
    try {
      const dbScope =
        scope === "country" ? "country" : scope === "city" || scope === "full" ? "city" : "all";
      const dbItems = await dbGeoAutocomplete({ q, limit: remaining(), scope: dbScope });
      mergeUnique(results, dbItems.map(dbItemToGeo), limit);
    } catch (e) {
      console.warn("DB geo autocomplete failed.", e);
    }
  }

  if (!useFull && remaining() > 0) {
    const nom = await nominatimAutocomplete({ q, limit: remaining(), acceptLanguage: lang });
    mergeUnique(results, nom, limit);
  }

  const withCoords = await ensureCoordinatesOnSuggestions(q, results, lang);
  return useFull ? sortGeoAutocompleteResults(q, withCoords) : withCoords;
}

async function ensureCoordinatesOnSuggestions(
  q: string,
  items: GeoAutocompleteItem[],
  acceptLanguage: string,
): Promise<GeoAutocompleteItem[]> {
  const hasAny = items.some((i) => i.lat != null && i.lon != null);
  const lang = acceptLanguage.toLowerCase().startsWith("en") ? "en_US" : "ru_RU";

  if (!hasAny) {
    try {
      const { yandexForwardGeocode, isYandexGeocoderConfigured } = await import("./yandex");
      if (isYandexGeocoderConfigured()) {
        const hit = await yandexForwardGeocode(q, lang);
        if (hit) {
          return [
            { label: hit.label, lat: hit.lat, lon: hit.lon, kind: "city" as const },
            ...items,
          ].slice(0, 15);
        }
      }
    } catch (e) {
      console.warn("Forward geocode fallback failed.", e);
    }
    try {
      const nom = await nominatimAutocomplete({ q, limit: 1, acceptLanguage });
      const first = nom[0];
      if (first?.lat != null && first.lon != null) {
        return [first, ...items].slice(0, 15);
      }
    } catch (e) {
      console.warn("Nominatim geocode fallback failed.", e);
    }
  }

  const enriched: GeoAutocompleteItem[] = [];
  let forwardUsed = 0;
  for (const item of items) {
    if (item.lat != null && item.lon != null) {
      enriched.push(item);
      continue;
    }
    if (forwardUsed < 4) {
      forwardUsed += 1;
      try {
        const { yandexForwardGeocode, isYandexGeocoderConfigured } = await import("./yandex");
        if (isYandexGeocoderConfigured()) {
          const hit = await yandexForwardGeocode(item.label || q, lang);
          if (hit) {
            enriched.push({ ...item, label: hit.label, lat: hit.lat, lon: hit.lon });
            continue;
          }
        }
      } catch {
        /* keep original */
      }
    }
    enriched.push(item);
  }
  return enriched;
}
