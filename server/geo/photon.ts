import type { GeoAutocompleteItem } from "./nominatim";

/** Komoot Photon — free OSM geocoder (addresses, streets, POI). Fair-use: ~1 req/s. */
const BASE = "https://photon.komoot.io/api/";

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
  geometry?: { coordinates?: [number, number] };
};

function buildLabel(p: NonNullable<PhotonFeature["properties"]>): string {
  const parts = [
    p.name,
    p.street ? [p.street, p.housenumber].filter(Boolean).join(" ") : null,
    p.city,
    p.state,
    p.country,
  ].filter(Boolean);
  return Array.from(new Set(parts)).join(", ");
}

function inferKind(p: NonNullable<PhotonFeature["properties"]>): GeoAutocompleteItem["kind"] {
  const key = p.osm_key ?? "";
  const val = p.osm_value ?? "";
  if (key === "place" && ["city", "town", "village", "hamlet", "municipality"].includes(val)) {
    return "city";
  }
  if (key === "boundary" && val === "country") return "country";
  if (["amenity", "shop", "tourism", "leisure", "building"].includes(key)) return "poi";
  return "address";
}

export async function photonAutocomplete(params: {
  q: string;
  limit: number;
  lang?: string | null;
}): Promise<GeoAutocompleteItem[]> {
  const q = params.q.trim();
  const limit = Math.max(1, Math.min(15, Math.floor(params.limit)));
  if (q.length < 2) return [];

  const url = new URL(BASE);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", (params.lang ?? "ru").split(",")[0] || "ru");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Photon error: ${res.status}`);
  }

  const json = (await res.json()) as { features?: PhotonFeature[] };
  const features = Array.isArray(json.features) ? json.features : [];

  const out: GeoAutocompleteItem[] = [];
  for (const f of features) {
    const p = f.properties;
    const coords = f.geometry?.coordinates;
    if (!p) continue;
    const label = buildLabel(p);
    if (!label) continue;
    out.push({
      label,
      kind: inferKind(p),
      lat: coords?.[1] ?? null,
      lon: coords?.[0] ?? null,
      city: p.city ?? null,
      country: p.country ?? null,
    });
    if (out.length >= limit) break;
  }
  return out;
}
