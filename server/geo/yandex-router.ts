import { getYandexRouterKey } from "./yandex-config";

const ROUTE_URL = "https://api.routing.yandex.net/v2/route";

export type RouteMode = "driving" | "walking" | "transit";

export type YandexRouteResult = {
  distanceM: number;
  durationS: number;
  /** [longitude, latitude] for map line */
  geometry: [number, number][];
};

type RouteLeg = {
  status?: string;
  length?: number;
  duration?: number;
  steps?: Array<{
    length?: number;
    duration?: number;
    polyline?: { points?: unknown[] };
  }>;
};

type RouterResponse = {
  route?: {
    legs?: RouteLeg[];
    geometry?: unknown;
  };
  routes?: Array<{
    legs?: RouteLeg[];
    geometry?: unknown;
  }>;
};

function pushCoord(out: [number, number][], lng: number, lat: number) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
  const prev = out[out.length - 1];
  if (prev && prev[0] === lng && prev[1] === lat) return;
  out.push([lng, lat]);
}

/** Yandex step polyline points are [latitude, longitude] (see API docs). */
function yandexPointToLngLat(a: number, b: number): [number, number] {
  return [b, a];
}

function extractGeometryFromLegs(legs: RouteLeg[] | undefined): [number, number][] {
  const out: [number, number][] = [];
  for (const leg of legs ?? []) {
    for (const step of leg.steps ?? []) {
      const pts = step.polyline?.points;
      if (!Array.isArray(pts)) continue;
      for (const pt of pts) {
        if (!Array.isArray(pt) || pt.length < 2) continue;
        const lat = Number(pt[0]);
        const lon = Number(pt[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const [lng, latOut] = yandexPointToLngLat(lat, lon);
        pushCoord(out, lng, latOut);
      }
    }
  }
  return out;
}

/** Variable-length quantity polyline (precision 6) — legacy encoded geometry */
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

    pushCoord(coordinates, lng / 1e6, lat / 1e6);
  }

  return coordinates;
}

function parseLegacyGeometry(geometry: unknown): [number, number][] {
  if (!geometry) return [];

  if (typeof geometry === "string") {
    return decodePolyline6(geometry);
  }

  if (Array.isArray(geometry)) {
    const out: [number, number][] = [];
    for (const pt of geometry) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const a = Number(pt[0]);
      const b = Number(pt[1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        pushCoord(out, b, a);
      } else {
        pushCoord(out, a, b);
      }
    }
    return out;
  }

  return [];
}

function extractRouteGeometry(route: {
  legs?: RouteLeg[];
  geometry?: unknown;
}): [number, number][] {
  const fromLegs = extractGeometryFromLegs(route.legs);
  if (fromLegs.length > 1) return fromLegs;
  return parseLegacyGeometry(route.geometry);
}

/** OSRM fallback when Yandex Router is unavailable (driving/walking only). */
async function osrmBuildRoute(
  points: Array<{ lat: number; lon: number }>,
  mode: "driving" | "walking",
): Promise<YandexRouteResult | null> {
  if (points.length < 2) return null;
  const profile = mode === "walking" ? "foot" : "car";
  const coordStr = points.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
    }>;
  };

  const route = data.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (!route || !coords || coords.length < 2) return null;

  return {
    distanceM: route.distance ?? 0,
    durationS: route.duration ?? 0,
    geometry: coords,
  };
}

export async function yandexBuildRoute(
  points: Array<{ lat: number; lon: number }>,
  mode: RouteMode = "driving",
): Promise<YandexRouteResult | null> {
  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if (valid.length < 2) return null;

  const apikey = getYandexRouterKey();
  if (apikey) {
    const waypoints = valid.map((p) => `${p.lat},${p.lon}`).join("|");
    const url = new URL(ROUTE_URL);
    url.searchParams.set("apikey", apikey);
    url.searchParams.set("waypoints", waypoints);
    url.searchParams.set("mode", mode);

    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = (await res.json()) as RouterResponse;
        const route = data.route ?? data.routes?.[0];
        if (route) {
          const legs = route.legs ?? [];
          const distanceM = legs.reduce((s, leg) => {
            if (leg.length != null && leg.length > 0) return s + leg.length;
            return s + (leg.steps ?? []).reduce((ss, step) => ss + (step.length ?? 0), 0);
          }, 0);
          const durationS = legs.reduce((s, leg) => {
            if (leg.duration != null && leg.duration > 0) return s + leg.duration;
            return s + (leg.steps ?? []).reduce((ss, step) => ss + (step.duration ?? 0), 0);
          }, 0);
          const geometry = extractRouteGeometry(route);
          if (geometry.length > 1) {
            return { distanceM, durationS, geometry };
          }
        }
      }
    } catch {
      /* fall through to OSRM */
    }
  }

  if (mode === "transit") return null;

  try {
    return await osrmBuildRoute(valid, mode);
  } catch {
    return null;
  }
}

export async function buildRoute(
  points: Array<{ lat: number; lon: number }>,
  mode: RouteMode = "driving",
): Promise<YandexRouteResult | null> {
  return yandexBuildRoute(points, mode);
}
