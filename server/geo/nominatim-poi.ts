import { allowGeoRequest } from "./nominatim";

export type OsmPoiResult = {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  type: string;
  address: string | null;
  source: "osm";
};

type NominatimPoiItem = {
  place_id?: number;
  osm_id?: number;
  osm_type?: string;
  class?: string;
  type?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  importance?: number;
};

const BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "All-in-travel/1.0 (poi search)";

const POI_CLASSES = new Set([
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "office",
  "craft",
  "building",
]);

const TYPE_TO_OSM: Record<string, string> = {
  hotel: "hotel",
  restaurant: "restaurant",
  attraction: "attraction",
  tour: "travel_agency",
};

type CacheEntry = { expiresAt: number; data: OsmPoiResult[] };
const cache = new Map<string, CacheEntry>();

function shortName(displayName: string): string {
  const first = displayName.split(",")[0]?.trim();
  return first || displayName;
}

function inferPlaceType(osmType?: string, osmClass?: string): string {
  const t = (osmType ?? "").toLowerCase();
  if (["hotel", "motel", "hostel", "guest_house"].includes(t)) return "hotel";
  if (["restaurant", "cafe", "fast_food", "food_court", "bar", "pub"].includes(t))
    return "restaurant";
  if (["museum", "attraction", "viewpoint", "theme_park", "gallery"].includes(t))
    return "attraction";
  if (osmClass === "tourism") return "attraction";
  if (osmClass === "amenity" && t.includes("restaurant")) return "restaurant";
  return "attraction";
}

function buildPoiQuery(q: string, filterType?: string): string {
  const trimmed = q.trim();
  if (!trimmed) return "";
  const mapped = filterType && filterType !== "all" ? TYPE_TO_OSM[filterType] : null;
  if (mapped && !trimmed.toLowerCase().includes(mapped)) {
    return `${mapped} ${trimmed}`;
  }
  return trimmed;
}

export async function nominatimPoiSearch(params: {
  q: string;
  limit?: number;
  lat?: number;
  lon?: number;
  filterType?: string;
  acceptLanguage?: string | null;
}): Promise<OsmPoiResult[]> {
  const q = buildPoiQuery(params.q, params.filterType);
  if (q.length < 2) return [];

  const limit = Math.max(1, Math.min(25, Math.floor(params.limit ?? 15)));
  const lang = (params.acceptLanguage ?? "").trim();
  const cacheKey = `poi:v1:${q.toLowerCase()}:${limit}:${params.lat ?? ""}:${params.lon ?? ""}:${params.filterType ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const url = new URL(BASE_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit * 2));
  url.searchParams.set("dedupe", "1");

  if (
    params.lat != null &&
    params.lon != null &&
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lon)
  ) {
    const d = 0.35;
    const minLon = params.lon - d;
    const maxLon = params.lon + d;
    const minLat = params.lat - d;
    const maxLat = params.lat + d;
    url.searchParams.set("viewbox", `${minLon},${maxLat},${maxLon},${minLat}`);
    url.searchParams.set("bounded", "1");
  }

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      ...(lang ? { "Accept-Language": lang } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim POI error: ${res.status}`);
  }

  const json = (await res.json()) as NominatimPoiItem[];
  const rows = (Array.isArray(json) ? json : [])
    .filter((it) => {
      const cls = it.class ?? "";
      if (POI_CLASSES.has(cls)) return true;
      const t = (it.type ?? "").toLowerCase();
      return ["restaurant", "hotel", "cafe", "fast_food", "museum", "attraction"].includes(t);
    })
    .filter((it) => it.lat && it.lon)
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, limit);

  const items: OsmPoiResult[] = rows.map((it) => {
    const osmId = it.osm_id ?? it.place_id ?? Math.random();
    const placeType = inferPlaceType(it.type, it.class);
    return {
      id: `osm-${it.osm_type ?? "node"}-${osmId}`,
      name: shortName(it.display_name ?? q),
      latitude: it.lat!,
      longitude: it.lon!,
      type: placeType,
      address: it.display_name ?? null,
      source: "osm" as const,
    };
  });

  cache.set(cacheKey, { data: items, expiresAt: Date.now() + 3 * 60 * 60 * 1000 });
  return items;
}

export { allowGeoRequest };
