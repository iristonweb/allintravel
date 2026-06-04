export type RoutePoint = { lat: number; lon: number; label?: string };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MATCH_RADIUS_KM = 35;

function waypointPoints(
  waypoints: { place?: { latitude: string | number | null; longitude: string | number | null; name?: string } | null }[],
): RoutePoint[] {
  return waypoints
    .filter((w) => w.place?.latitude != null && w.place?.longitude != null)
    .map((w) => ({
      lat: Number(w.place!.latitude),
      lon: Number(w.place!.longitude),
      label: w.place?.name ?? undefined,
    }));
}

function pointsNear(a: RoutePoint[], b: RoutePoint[], radiusKm: number): number {
  let matches = 0;
  for (const p of a) {
    if (b.some((q) => haversineKm(p.lat, p.lon, q.lat, q.lon) <= radiusKm)) matches += 1;
  }
  return matches;
}

/** Overlap score 0–100: share of stops in A that are near any stop in B (symmetric average). */
export function computeRouteOverlapPercent(
  waypointsA: Parameters<typeof waypointPoints>[0],
  waypointsB: Parameters<typeof waypointPoints>[0],
): number {
  const a = waypointPoints(waypointsA);
  const b = waypointPoints(waypointsB);
  if (a.length === 0 || b.length === 0) return 0;
  const matchA = pointsNear(a, b, MATCH_RADIUS_KM);
  const matchB = pointsNear(b, a, MATCH_RADIUS_KM);
  const scoreA = (matchA / a.length) * 100;
  const scoreB = (matchB / b.length) * 100;
  return Math.round((scoreA + scoreB) / 2);
}
