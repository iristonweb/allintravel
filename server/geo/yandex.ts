import type { GeoAutocompleteItem } from "./nominatim";

type YandexGeocodeResponse = {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject?: {
          name?: string;
          description?: string;
          Point?: { pos?: string };
          metaDataProperty?: {
            GeocoderMetaData?: {
              text?: string;
              kind?: string;
              Address?: {
                country_code?: string;
                formatted?: string;
                Components?: Array<{ kind?: string; name?: string }>;
              };
            };
          };
        };
      }>;
    };
  };
};

type YandexSuggestResponse = {
  results?: Array<{
    title?: { text?: string };
    subtitle?: { text?: string };
    uri?: string;
    tags?: string[];
  }>;
};

const GEOCODE_URL = "https://geocode-maps.yandex.ru/v1/";
const SUGGEST_URL = "https://suggest-maps.yandex.ru/v1/suggest";

type CacheEntry = { expiresAt: number; data: GeoAutocompleteItem[] };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): GeoAutocompleteItem[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: GeoAutocompleteItem[], ttlMs = 1000 * 60 * 10) {
  cache.set(key, { expiresAt: Date.now() + ttlMs, data });
}

function getApiKey(): string | undefined {
  return process.env.YANDEX_GEOCODER_API_KEY?.trim() || undefined;
}

function parsePos(pos: string | undefined): { lat: number; lon: number } | null {
  if (!pos) return null;
  const [lonStr, latStr] = pos.trim().split(/\s+/);
  const lat = Number(latStr);
  const lon = Number(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

type YandexFeatureMember = {
  GeoObject?: {
    name?: string;
    description?: string;
    Point?: { pos?: string };
    metaDataProperty?: {
      GeocoderMetaData?: {
        text?: string;
        Address?: {
          Components?: Array<{ kind?: string; name?: string }>;
        };
      };
    };
  };
};

function memberToItem(member: YandexFeatureMember): GeoAutocompleteItem | null {
  const obj = member?.GeoObject;
  if (!obj) return null;
  const meta = obj.metaDataProperty?.GeocoderMetaData;
  const label = meta?.text || [obj.name, obj.description].filter(Boolean).join(", ");
  if (!label) return null;

  const coords = parsePos(obj.Point?.pos);
  const components = meta?.Address?.Components ?? [];
  const city =
    components.find((c) => c.kind === "locality")?.name ??
    components.find((c) => c.kind === "area")?.name ??
    null;
  const country = components.find((c) => c.kind === "country")?.name ?? null;

  return {
    label,
    city,
    country,
    lat: coords?.lat ?? null,
    lon: coords?.lon ?? null,
  };
}

async function yandexGeocodeSuggest(params: {
  q: string;
  limit: number;
  lang?: string;
}): Promise<GeoAutocompleteItem[]> {
  const apikey = getApiKey();
  if (!apikey) return [];

  const { q, limit } = params;
  const lang = params.lang ?? "ru_RU";
  const cacheKey = `yandex:geocode:${lang}:${q.toLowerCase()}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("geocode", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", lang);
  url.searchParams.set("results", String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yandex Geocoder ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as YandexGeocodeResponse;
  const members = data.response?.GeoObjectCollection?.featureMember ?? [];
  const items = members.map(memberToItem).filter((x): x is GeoAutocompleteItem => !!x);

  cacheSet(cacheKey, items);
  return items;
}

async function yandexSuggest(params: {
  q: string;
  limit: number;
  lang?: string;
}): Promise<GeoAutocompleteItem[]> {
  const apikey = getApiKey();
  if (!apikey) return [];

  const { q, limit } = params;
  const lang = params.lang ?? "ru_RU";
  const cacheKey = `yandex:suggest:${lang}:${q.toLowerCase()}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = new URL(SUGGEST_URL);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("text", q);
  url.searchParams.set("results", String(limit));
  url.searchParams.set("lang", lang);
  url.searchParams.set("types", "geo");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return yandexGeocodeSuggest(params);
  }

  const data = (await res.json()) as YandexSuggestResponse;
  const items: GeoAutocompleteItem[] = [];
  for (const r of data.results ?? []) {
    const title = r.title?.text?.trim();
    if (!title) continue;
    const subtitle = r.subtitle?.text?.trim();
    items.push({
      label: subtitle ? `${title}, ${subtitle}` : title,
      city: title,
      country: subtitle ?? null,
    });
  }

  if (items.length === 0) {
    return yandexGeocodeSuggest(params);
  }

  cacheSet(cacheKey, items);
  return items;
}

export async function yandexAutocomplete(params: {
  q: string;
  limit: number;
  acceptLanguage?: string | null;
}): Promise<GeoAutocompleteItem[]> {
  const lang = params.acceptLanguage?.toLowerCase().startsWith("en") ? "en_US" : "ru_RU";
  try {
    return await yandexSuggest({ q: params.q, limit: params.limit, lang });
  } catch (e) {
    console.warn("Yandex suggest failed, trying geocoder:", e);
    return yandexGeocodeSuggest({ q: params.q, limit: params.limit, lang });
  }
}

export function isYandexGeocoderConfigured(): boolean {
  return !!getApiKey();
}

/** Forward geocode: address string → coordinates */
export async function yandexForwardGeocode(
  address: string,
  lang = "ru_RU",
): Promise<{ lat: number; lon: number; label: string } | null> {
  const items = await yandexGeocodeSuggest({ q: address, limit: 1, lang });
  const first = items[0];
  if (!first || first.lat == null || first.lon == null) return null;
  return { lat: first.lat, lon: first.lon, label: first.label };
}
