import type { GeoAutocompleteItem } from "@/components/location-autocomplete-input";
import { pickBestGeoSuggestion } from "@/lib/geo-pick";
import { apiRequest, toApiUrl } from "@/lib/queryClient";

export function geoItemHasCoords(item: GeoAutocompleteItem): boolean {
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

export async function fetchGeoSuggestions(
  q: string,
  options?: { scope?: "city" | "country" | "all" | "full"; limit?: number },
): Promise<GeoAutocompleteItem[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(options?.limit ?? 12),
    scope: options?.scope ?? "full",
  });
  const res = await fetch(toApiUrl(`/api/geo/autocomplete?${params.toString()}`), {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as GeoAutocompleteItem[];
  return Array.isArray(data) ? data : [];
}

/** Forward geocode when autocomplete items lack coordinates (common for city names). */
export async function geocodeGeoQuery(q: string): Promise<GeoAutocompleteItem | null> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return null;
  const params = new URLSearchParams({ q: trimmed });
  const res = await fetch(toApiUrl(`/api/geo/geocode?${params.toString()}`), {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat?: number; lon?: number; label?: string } | null;
  if (data?.lat == null || data?.lon == null) return null;
  return {
    label: data.label?.trim() || trimmed,
    lat: Number(data.lat),
    lon: Number(data.lon),
    kind: "city",
  };
}

export async function resolveGeoFromQuery(
  q: string,
  options?: { scope?: "city" | "country" | "all" | "full" },
): Promise<GeoAutocompleteItem | null> {
  const items = await fetchGeoSuggestions(q, options);
  const picked = pickBestGeoSuggestion(q, items);
  if (picked && geoItemHasCoords(picked)) return picked;
  return geocodeGeoQuery(q);
}

export type TripRouteDraft = {
  label: string;
  lat: number;
  lon: number;
};

export function geoItemToDraft(item: GeoAutocompleteItem): TripRouteDraft | null {
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  if (!item.label?.trim() || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { label: item.label.trim(), lat, lon };
}

export async function addTripStopFromGeo(tripId: string, item: GeoAutocompleteItem): Promise<void> {
  const draft = geoItemToDraft(item);
  if (!draft) throw new Error("Укажите место с координатами");
  await apiRequest("POST", `/api/trips/${tripId}/waypoints/from-location`, {
    label: draft.label,
    lat: draft.lat,
    lon: draft.lon,
  });
}

export async function addTripStopsFromDrafts(tripId: string, drafts: TripRouteDraft[]): Promise<void> {
  for (const draft of drafts) {
    await apiRequest("POST", `/api/trips/${tripId}/waypoints/from-location`, {
      label: draft.label,
      lat: draft.lat,
      lon: draft.lon,
    });
  }
}
