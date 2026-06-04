import type { GeoAutocompleteItem } from "./nominatim";
import { nominatimAutocomplete } from "./nominatim";
import { isAnyYandexGeoConfigured } from "./yandex-config";
import { yandexAutocomplete } from "./yandex";
import { dbGeoAutocomplete } from "./db-autocomplete";

function clampLimit(limit: number) {
  return Math.max(1, Math.min(12, Math.floor(limit)));
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

function dbItemToGeo(item: Awaited<ReturnType<typeof dbGeoAutocomplete>>[number]): GeoAutocompleteItem {
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
 * DB cities/countries first; if empty or partial, fill from Yandex then Nominatim.
 */
export async function resolveGeoAutocomplete(params: {
  q: string;
  limit?: number;
  scope?: "city" | "country" | "all";
  acceptLanguage?: string | null;
}): Promise<GeoAutocompleteItem[]> {
  const q = params.q.trim();
  const limit = clampLimit(params.limit ?? 8);
  const scope = params.scope ?? "all";
  const results: GeoAutocompleteItem[] = [];

  if (process.env.DATABASE_URL) {
    try {
      const dbItems = await dbGeoAutocomplete({ q, limit, scope });
      mergeUnique(results, dbItems.map(dbItemToGeo), limit);
    } catch (e) {
      console.warn("DB geo autocomplete failed; using external providers.", e);
    }
  }

  const remaining = () => Math.max(0, limit - results.length);

  if (remaining() > 0 && isAnyYandexGeoConfigured()) {
    try {
      const ya = await yandexAutocomplete({
        q,
        limit: remaining(),
        acceptLanguage: params.acceptLanguage ?? null,
      });
      mergeUnique(results, ya, limit);
    } catch (e) {
      console.warn("Yandex autocomplete failed; trying Nominatim.", e);
    }
  }

  if (remaining() > 0) {
    const nom = await nominatimAutocomplete({
      q,
      limit: remaining(),
      acceptLanguage: params.acceptLanguage ?? null,
    });
    mergeUnique(results, nom, limit);
  }

  return results;
}
