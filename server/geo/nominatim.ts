export type GeoAutocompleteItem = {
  label: string;
  kind?: "city" | "country" | "address" | "poi";
  countryCode?: string;
  geonameId?: number;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lon?: number | null;
  population?: number;
  osmId?: number | null;
  osmType?: string | null;
};

type NominatimSearchItem = {
  display_name?: string;
  lat?: string;
  lon?: string;
  osm_id?: number;
  osm_type?: string;
  class?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
};

const BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "All-in-travel/1.0 (geocoding autocomplete)";

type CacheEntry = { expiresAt: number; data: GeoAutocompleteItem[] };
const cache = new Map<string, CacheEntry>();

type Bucket = { tokens: number; lastRefillMs: number };
const buckets = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

function cacheGet(key: string): GeoAutocompleteItem[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: GeoAutocompleteItem[], ttlMs: number) {
  cache.set(key, { data, expiresAt: nowMs() + ttlMs });
}

/**
 * Token bucket rate limit: each key refills at `ratePerSec`, up to `burst`.
 * Returns true if request is allowed (token consumed).
 */
export function allowGeoRequest(key: string, ratePerSec = 4, burst = 12): boolean {
  const t = nowMs();
  const b = buckets.get(key) ?? { tokens: burst, lastRefillMs: t };

  const elapsedSec = Math.max(0, (t - b.lastRefillMs) / 1000);
  const refill = elapsedSec * ratePerSec;
  b.tokens = Math.min(burst, b.tokens + refill);
  b.lastRefillMs = t;

  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }

  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

function pickCity(a?: NominatimSearchItem["address"]): string | null {
  if (!a) return null;
  return a.city ?? a.town ?? a.village ?? a.municipality ?? a.state ?? null;
}

function inferNominatimKind(it: NominatimSearchItem): GeoAutocompleteItem["kind"] {
  const cls = it.class ?? "";
  const typ = it.type ?? "";
  if (cls === "boundary" && typ === "country") return "country";
  if (cls === "place" && ["city", "town", "village", "hamlet", "municipality"].includes(typ)) {
    return "city";
  }
  if (["amenity", "shop", "tourism", "leisure", "building", "craft"].includes(cls)) return "poi";
  return "address";
}

function toNumberOrNull(v?: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function nominatimAutocomplete(params: {
  q: string;
  limit: number;
  acceptLanguage?: string | null;
}): Promise<GeoAutocompleteItem[]> {
  const q = params.q.trim();
  const limit = Math.max(1, Math.min(10, Math.floor(params.limit)));
  const lang = (params.acceptLanguage ?? "").trim();

  const cacheKey = `nominatim:v1:q=${q.toLowerCase()}:limit=${limit}:lang=${lang.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = new URL(BASE_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));
  // Prefer real-world places; still returns countries/cities/etc.
  url.searchParams.set("dedupe", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      ...(lang ? { "Accept-Language": lang } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim error: ${res.status}`);
  }

  const json = (await res.json()) as NominatimSearchItem[];
  const items: GeoAutocompleteItem[] = (Array.isArray(json) ? json : [])
    .map((it) => ({
      label: it.display_name ?? "",
      kind: inferNominatimKind(it),
      city: pickCity(it.address),
      country: it.address?.country ?? null,
      lat: toNumberOrNull(it.lat),
      lon: toNumberOrNull(it.lon),
      osmId: typeof it.osm_id === "number" ? it.osm_id : null,
      osmType: it.osm_type ?? null,
    }))
    .filter((x) => x.label);

  // 6 hours cache to reduce external traffic
  cacheSet(cacheKey, items, 6 * 60 * 60 * 1000);
  return items;
}

