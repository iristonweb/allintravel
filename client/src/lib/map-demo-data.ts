export type DemoMarkerVariant = "purple" | "orange" | "green";

export type DemoMarker = {
  lat: number;
  lon: number;
  label: string;
  variant: DemoMarkerVariant;
};

const DEMO_MARKERS: DemoMarker[] = [
  { lat: 64.15, lon: -21.95, label: "12", variant: "purple" },
  { lat: 55.68, lon: 12.57, label: "8", variant: "green" },
  { lat: 48.86, lon: 2.35, label: "24", variant: "orange" },
  { lat: 35.68, lon: 139.69, label: "16", variant: "purple" },
  { lat: 40.71, lon: -73.98, label: "5", variant: "orange" },
  { lat: -31.95, lon: 115.86, label: "9", variant: "green" },
];

const DEMO_ROUTE_CHAINS: { lat: number; lon: number }[][] = [
  [
    { lat: 64.15, lon: -21.95 },
    { lat: 55.68, lon: 12.57 },
    { lat: 48.86, lon: 2.35 },
    { lat: 35.68, lon: 139.69 },
  ],
  [
    { lat: 34.05, lon: -118.24 },
    { lat: 40.71, lon: -73.98 },
    { lat: 51.5, lon: -0.12 },
    { lat: -31.95, lon: 115.86 },
  ],
];

export function demoRoutesMapbox(): [number, number][][] {
  return DEMO_ROUTE_CHAINS.map((route) => route.map((p) => [p.lon, p.lat]));
}

export function demoRoutesYandex(): [number, number][][] {
  return DEMO_ROUTE_CHAINS.map((route) => route.map((p) => [p.lat, p.lon]));
}

export function demoMarkersMapbox(): {
  lng: number;
  lat: number;
  label: string;
  variant: DemoMarkerVariant;
}[] {
  return DEMO_MARKERS.map((m) => ({
    lng: m.lon,
    lat: m.lat,
    label: m.label,
    variant: m.variant,
  }));
}

export function demoMarkersYandex(): {
  lat: number;
  lon: number;
  label: string;
  variant: DemoMarkerVariant;
}[] {
  return DEMO_MARKERS.map((m) => ({
    lat: m.lat,
    lon: m.lon,
    label: m.label,
    variant: m.variant,
  }));
}
