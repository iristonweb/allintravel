import { getYandexRouterKey } from "./yandex-config";

const ROUTE_URL = "https://api.routing.yandex.net/v2/route";

export type YandexRouteResult = {
  distanceM: number;
  durationS: number;
  /** [longitude, latitude] for map line */
  geometry: [number, number][];
};

type RouterResponse = {
  route?: {
    legs?: Array<{ length?: number; duration?: number }>;
    geometry?: unknown;
  };
  routes?: Array<{
    legs?: Array<{ length?: number; duration?: number }>;
    geometry?: unknown;
  }>;
};

function parseGeometry(geometry: unknown): [number, number][] {
  if (!geometry) return [];

  if (typeof geometry === "string") {
    return decodePolyline6(geometry);
  }

  if (Array.isArray(geometry)) {
    const out: [number, number][] = [];
    for (const pt of geometry) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const a = Number(pt[0]);
        const b = Number(pt[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (Math.abs(a) <= 90 && Math.abs(b) > 90) {
          out.push([b, a]);
        } else {
          out.push([a, b]);
        }
      }
    }
    return out;
  }

  return [];
}

/** Variable-length quantity polyline (precision 6) — used by Yandex Router */
function decodePolyline6(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / 1e6, lat / 1e6]);
  }

  return coordinates;
}

export async function yandexBuildRoute(
  points: Array<{ lat: number; lon: number }>,
  mode: "driving" | "walking" = "driving",
): Promise<YandexRouteResult | null> {
  const apikey = getYandexRouterKey();
  if (!apikey || points.length < 2) return null;

  const waypoints = points
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => `${p.lat},${p.lon}`)
    .join("|");

  if (!waypoints) return null;

  const url = new URL(ROUTE_URL);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("waypoints", waypoints);
  url.searchParams.set("mode", mode);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yandex Router ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as RouterResponse;
  const route = data.route ?? data.routes?.[0];
  if (!route) return null;

  const legs = route.legs ?? [];
  const distanceM = legs.reduce((s, l) => s + (l.length ?? 0), 0);
  const durationS = legs.reduce((s, l) => s + (l.duration ?? 0), 0);
  const geometry = parseGeometry(route.geometry);

  return {
    distanceM,
    durationS,
    geometry: geometry.length > 0 ? geometry : points.map((p) => [p.lon, p.lat]),
  };
}
