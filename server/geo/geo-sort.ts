import type { GeoAutocompleteItem } from "./nominatim";

/** Query likely targets a street address (not only city/country). */
export function looksLikeAddressQuery(q: string): boolean {
  const s = q.trim();
  if (/\d/.test(s)) return true;
  return /ул\.?|улица|пр\.?|просп|пер\.?|переулок|д\.|дом|кв\.|корп\.|стр\.|str\.|street|st\.|ave|avenue|бульвар|шоссе|наб\.|набережная|пл\.|площадь|туп\.|lane|road|building|достопримечательность/i.test(
    s,
  );
}

function kindRank(item: GeoAutocompleteItem): number {
  switch (item.kind) {
    case "address":
      return 0;
    case "poi":
      return 1;
    case "city":
      return 4;
    case "country":
      return 6;
    default:
      return 2;
  }
}

function labelMatchScore(q: string, label: string): number {
  const ql = q.trim().toLowerCase();
  const ll = label.trim().toLowerCase();
  if (!ql || !ll) return 0;
  if (ll === ql) return 100;
  if (ll.startsWith(ql)) return 80;
  if (ll.includes(ql)) return 50;
  return 0;
}

/** Prefer streets/houses/POI over cities when user searches for an address. */
export function sortGeoAutocompleteResults(
  q: string,
  items: GeoAutocompleteItem[],
): GeoAutocompleteItem[] {
  const preferAddress = looksLikeAddressQuery(q);
  return [...items].sort((a, b) => {
    if (preferAddress) {
      const rankDiff = kindRank(a) - kindRank(b);
      if (rankDiff !== 0) return rankDiff;
    }
    const matchDiff = labelMatchScore(q, b.label) - labelMatchScore(q, a.label);
    if (matchDiff !== 0) return matchDiff;
    return (b.population ?? 0) - (a.population ?? 0);
  });
}

export function pickBestGeoMatch(
  q: string,
  items: GeoAutocompleteItem[],
): GeoAutocompleteItem | null {
  const withCoords = items.filter((item) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    return Number.isFinite(lat) && Number.isFinite(lon);
  });
  if (withCoords.length === 0) return null;
  const sorted = sortGeoAutocompleteResults(q, withCoords);
  const exact = sorted.find(
    (item) => item.label.trim().toLowerCase() === q.trim().toLowerCase(),
  );
  if (exact) return exact;
  if (looksLikeAddressQuery(q)) {
    const addressLike = sorted.find((item) => item.kind === "address" || item.kind === "poi");
    if (addressLike) return addressLike;
  }
  return sorted[0] ?? null;
}
