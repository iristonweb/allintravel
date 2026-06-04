import type { GeoAutocompleteItem } from "@/components/location-autocomplete-input";
import type { Place } from "@shared/schema";

export type DestinationSearchResult = {
  locations: GeoAutocompleteItem[];
  places: Place[];
};

export type DestinationPick =
  | { type: "location"; item: GeoAutocompleteItem }
  | { type: "place"; place: Place }
  | { type: "text"; query: string };

export type DestinationHrefMode = "default" | "map";

export function buildDestinationHref(
  pick: DestinationPick,
  placeType?: string,
  mode: DestinationHrefMode = "default",
): string {
  if (pick.type === "place") {
    if (mode === "map") {
      const p = pick.place;
      const lat = p.latitude != null ? Number(p.latitude) : NaN;
      const lon = p.longitude != null ? Number(p.longitude) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const params = new URLSearchParams();
        params.set("q", p.name);
        params.set("lat", String(lat));
        params.set("lon", String(lon));
        if (placeType && placeType !== "all") params.set("type", placeType);
        return `/map?${params.toString()}`;
      }
    }
    return `/place/${pick.place.id}`;
  }

  if (pick.type === "location") {
    const item = pick.item;
    const params = new URLSearchParams();
    params.set("q", item.label);
    if (item.lat != null && item.lon != null) {
      params.set("lat", String(item.lat));
      params.set("lon", String(item.lon));
    }
    if (item.kind === "country" && item.countryCode) {
      params.set("country", item.countryCode);
    }
    if (item.geonameId) params.set("cityId", String(item.geonameId));
    if (placeType && placeType !== "all") params.set("type", placeType);
    return `/map?${params.toString()}`;
  }

  const q = pick.query.trim();
  if (!q) return "/map";
  if (mode === "map") {
    const params = new URLSearchParams({ q });
    if (placeType && placeType !== "all") params.set("type", placeType);
    return `/map?${params.toString()}`;
  }
  const params = new URLSearchParams({ search: q });
  if (placeType && placeType !== "all") params.set("type", placeType);
  return `/places?${params.toString()}`;
}

export async function geocodeDestination(
  q: string,
): Promise<{ lat: number; lon: number; label: string } | null> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return null;
  const res = await fetch(`/api/geo/geocode?q=${encodeURIComponent(trimmed)}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data.lat !== "number" || typeof data.lon !== "number") return null;
  return data as { lat: number; lon: number; label: string };
}

export async function fetchDestinationSearch(
  q: string,
  opts?: { limit?: number; placeType?: string },
): Promise<DestinationSearchResult> {
  const params = new URLSearchParams();
  params.set("q", q.trim());
  params.set("limit", String(opts?.limit ?? 10));
  if (opts?.placeType && opts.placeType !== "all") params.set("type", opts.placeType);

  const res = await fetch(`/api/search/destinations?${params}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || String(res.status));
  }
  return res.json() as Promise<DestinationSearchResult>;
}
