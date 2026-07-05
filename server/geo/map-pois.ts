import type { IStorage } from "../storage";
import type { Place } from "@shared/schema";
import { nominatimPoiSearch, type OsmPoiResult } from "./nominatim-poi";

export type MapPoi = Place | OsmPoiResult;

export type MapPoiSearchParams = {
  q: string;
  type?: string;
  lat?: number;
  lon?: number;
  acceptLanguage?: string;
};

/** Shared map POI pipeline: catalog + Nominatim OSM merge. */
export async function searchMapPois(
  storage: IStorage,
  params: MapPoiSearchParams,
): Promise<MapPoi[]> {
  const q = params.q.trim();
  if (q.length < 2) return [];

  const type = params.type;
  const lat = params.lat;
  const lon = params.lon;

  const segments = q
    .split(/[,;]|(?:\s+—\s+)|(?:\s+–\s+)|(?:\s+-\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const keywords = segments.length >= 2 ? segments[segments.length - 1]! : q;
  const locationHint = segments.length >= 2 ? segments.slice(0, -1).join(", ") : q;

  const catalogTerms = [keywords, locationHint, q].filter(
    (t, i, arr) => t.length >= 2 && arr.indexOf(t) === i,
  );

  const catalogBatches = await Promise.all(
    catalogTerms.map((term) =>
      storage.getPlaces({
        search: term,
        type: type && type !== "all" ? type : undefined,
        limit: 20,
      }),
    ),
  );

  const catalogMap = new Map<string, Place>();
  for (const batch of catalogBatches) {
    for (const p of batch) {
      catalogMap.set(p.id, p);
    }
  }

  const osmPlaces = await nominatimPoiSearch({
    q: keywords.length >= 2 ? keywords : q,
    limit: 20,
    lat,
    lon,
    filterType: type,
    acceptLanguage: params.acceptLanguage,
  });

  return [...Array.from(catalogMap.values()), ...osmPlaces.filter((o) => !catalogMap.has(o.id))].slice(
    0,
    40,
  );
}

export type MapPoiLike = {
  id: string;
  name: string;
  latitude: string | number | null | undefined;
  longitude: string | number | null | undefined;
  type?: string | null;
  address?: string | null;
};

/** Resolve OSM or ephemeral ids to a catalog place UUID for waypoints. */
export async function ensureCatalogPlaceId(
  storage: IStorage,
  poi: MapPoiLike,
): Promise<string | null> {
  if (!poi.id.startsWith("osm-") && !poi.id.startsWith("trip-")) {
    return poi.id;
  }

  const lat = Number(poi.latitude);
  const lon = Number(poi.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const name = poi.name.trim();
  const candidates = await storage.getPlaces({ search: name, limit: 10 });
  const existing = candidates.find((p) => {
    const plat = Number(p.latitude);
    const plon = Number(p.longitude);
    return (
      Number.isFinite(plat) &&
      Number.isFinite(plon) &&
      Math.abs(plat - lat) < 0.08 &&
      Math.abs(plon - lon) < 0.08
    );
  });
  if (existing) return existing.id;

  const created = await storage.createPlace({
    name: name.length > 255 ? name.slice(0, 255) : name,
    type: poi.type ?? "attraction",
    latitude: String(lat),
    longitude: String(lon),
    address: poi.address ?? name,
    description: "Точка с карты",
  });
  return created.id;
}
