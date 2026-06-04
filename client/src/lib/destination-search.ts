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

export function buildDestinationHref(pick: DestinationPick, placeType?: string): string {
  if (pick.type === "place") {
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
    return `/map?${params.toString()}`;
  }

  const q = pick.query.trim();
  if (!q) return "/map";
  const params = new URLSearchParams({ search: q });
  if (placeType && placeType !== "all") params.set("type", placeType);
  return `/places?${params.toString()}`;
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
