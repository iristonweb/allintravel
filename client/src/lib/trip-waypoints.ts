import { apiRequest } from "@/lib/queryClient";
import type { GeoAutocompleteItem } from "@/components/location-autocomplete-input";

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
