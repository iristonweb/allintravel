import { toApiUrl } from "@/lib/queryClient";

export type RouteMode = "driving" | "walking" | "transit";

export type BuiltRoute = {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
};

function encodePointsParam(points: Array<{ lat: number; lon: number }>): string {
  return points.map((p) => `${p.lat},${p.lon}`).join("|");
}

export async function fetchBuiltRoute(
  points: Array<{ lat: number; lon: number }>,
  mode: RouteMode = "driving",
): Promise<BuiltRoute | null> {
  if (points.length < 2) return null;
  const params = new URLSearchParams({
    points: encodePointsParam(points),
    mode,
  });
  const res = await fetch(toApiUrl(`/api/geo/route?${params}`), { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { route: BuiltRoute | null };
  return data.route;
}

export async function fetchTripRoute(
  tripId: string,
  opts?: { day?: number; mode?: RouteMode },
): Promise<{ configured: boolean; route: BuiltRoute | null }> {
  const params = new URLSearchParams();
  if (opts?.day != null) params.set("day", String(opts.day));
  if (opts?.mode) params.set("mode", opts.mode);
  const q = params.toString();
  const res = await fetch(
    toApiUrl(`/api/trips/${tripId}/yandex-route${q ? `?${q}` : ""}`),
    { credentials: "include" },
  );
  if (!res.ok) {
    return { configured: false, route: null };
  }
  return res.json();
}
