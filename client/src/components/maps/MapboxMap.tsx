import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import PlaceMap, { type MapPlace } from "@/components/PlaceMap";
import { cn } from "@/lib/utils";

export type MapboxPlace = MapPlace;

export type MapFocus = { lat: number; lon: number; zoom?: number; label?: string };

type MapboxMapProps = {
  places?: MapboxPlace[];
  className?: string;
  height?: string;
  showRoute?: boolean;
  showDemoMarkers?: boolean;
  onPlaceClick?: (place: MapboxPlace) => void;
  mapFocus?: MapFocus | null;
  showDestinationPin?: boolean;
  /** Road geometry from Yandex Router [lng, lat] */
  routeGeometry?: [number, number][];
};

const DEMO_ROUTES: [number, number][][] = [
  [
    [-21.95, 64.15],
    [12.57, 55.68],
    [2.35, 48.86],
    [139.69, 35.68],
  ],
  [
    [-118.24, 34.05],
    [-73.98, 40.71],
    [-0.12, 51.5],
    [115.86, -31.95],
  ],
];

const DEMO_MARKERS: { lng: number; lat: number; label: string; variant: "purple" | "orange" | "green" }[] = [
  { lng: -21.95, lat: 64.15, label: "12", variant: "purple" },
  { lng: 12.57, lat: 55.68, label: "8", variant: "green" },
  { lng: 2.35, lat: 48.86, label: "24", variant: "orange" },
  { lng: 139.69, lat: 35.68, label: "16", variant: "purple" },
  { lng: -73.98, lat: 40.71, label: "5", variant: "orange" },
  { lng: 115.86, lat: -31.95, label: "9", variant: "green" },
];

function createMarkerElement(label: string, variant: "purple" | "orange" | "green") {
  const el = document.createElement("div");
  el.className = `ait-map-marker ait-map-marker--${variant}`;
  el.textContent = label;
  return el;
}

export default function MapboxMap({
  places = [],
  className,
  height = "100%",
  showRoute,
  showDemoMarkers,
  onPlaceClick,
  mapFocus,
  showDestinationPin,
  routeGeometry,
}: MapboxMapProps) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  const validPlaces = places.filter((p) => {
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [10, 30],
      zoom: 1.6,
      pitch: 28,
      bearing: -12,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      setReady(true);
      DEMO_ROUTES.forEach((coords, i) => {
        const id = `route-arc-${i}`;
        map.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });
        map.addLayer({
          id: `${id}-glow`,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": i === 0 ? "#8b5cf6" : "#ff7a18",
            "line-width": 6,
            "line-opacity": 0.2,
            "line-blur": 4,
          },
        });
        map.addLayer({
          id: `${id}-line`,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": i === 0 ? "#a855f7" : "#ffb347",
            "line-width": 2.5,
            "line-opacity": 0.85,
            "line-dasharray": [2, 1],
          },
        });
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !token) return;

    const markers: mapboxgl.Marker[] = [];

    if (showDemoMarkers) {
      DEMO_MARKERS.forEach((m) => {
        const el = createMarkerElement(m.label, m.variant);
        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(
          `<div style="padding:6px 2px;font-weight:600">${m.label} мест</div>`,
        );
        markers.push(
          new mapboxgl.Marker({ element: el })
            .setLngLat([m.lng, m.lat])
            .setPopup(popup)
            .addTo(map),
        );
      });
    }

    if (
      showDestinationPin &&
      mapFocus &&
      Number.isFinite(mapFocus.lat) &&
      Number.isFinite(mapFocus.lon)
    ) {
      const el = createMarkerElement("●", "purple");
      const label = mapFocus.label ?? "Направление";
      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(
        `<div style="padding:6px 2px;font-weight:600">${label}</div>`,
      );
      markers.push(
        new mapboxgl.Marker({ element: el })
          .setLngLat([mapFocus.lon, mapFocus.lat])
          .setPopup(popup)
          .addTo(map),
      );
    }

    validPlaces.forEach((place, index) => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      const variants: Array<"purple" | "orange" | "green"> = ["purple", "orange", "green"];
      const el = createMarkerElement(String(index + 1), variants[index % 3]);
      el.addEventListener("click", () => onPlaceClick?.(place));

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(
        `<div style="padding:6px 2px"><strong>${place.name}</strong>${place.type ? `<div style="opacity:0.7;font-size:11px;margin-top:2px">${place.type}</div>` : ""}</div>`,
      );

      markers.push(
        new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(map),
      );
    });

    const routeCoords =
      routeGeometry && routeGeometry.length > 1
        ? routeGeometry
        : showRoute && validPlaces.length > 1
          ? validPlaces.map(
              (p) => [Number(p.longitude), Number(p.latitude)] as [number, number],
            )
          : null;

    if (routeCoords && routeCoords.length > 1) {
      const routeId = "trip-route";
      const data = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: routeCoords },
      };
      if (map.getSource(routeId)) {
        (map.getSource(routeId) as mapboxgl.GeoJSONSource).setData(data);
      } else {
        map.addSource(routeId, { type: "geojson", data });
        map.addLayer({
          id: `${routeId}-glow`,
          type: "line",
          source: routeId,
          paint: { "line-color": "#22d3ee", "line-width": 8, "line-opacity": 0.25, "line-blur": 3 },
        });
        map.addLayer({
          id: `${routeId}-line`,
          type: "line",
          source: routeId,
          paint: { "line-color": "#22d3ee", "line-width": 4, "line-opacity": 0.95 },
        });
      }
      const bounds = routeCoords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]),
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }

    return () => markers.forEach((m) => m.remove());
  }, [validPlaces, ready, onPlaceClick, showRoute, showDemoMarkers, token, routeGeometry, mapFocus, showDestinationPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !mapFocus) return;
    const { lat, lon, zoom = 9 } = mapFocus;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    map.flyTo({ center: [lon, lat], zoom, essential: true });
  }, [mapFocus, ready]);

  if (!token) {
    return (
      <div className={cn("relative", className)} style={{ height }}>
        <PlaceMap
          places={validPlaces}
          height={height}
          showRoute={showRoute}
          glowMarkers
          numberedMarkers={showRoute || showDemoMarkers}
          routeGlow={showRoute}
          onPlaceClick={onPlaceClick}
          className="h-full rounded-none border-0"
        />
        <div className="absolute bottom-4 left-4 z-[1000] ait-glass rounded-xl px-3 py-2 text-xs text-muted-foreground max-w-xs">
          Добавьте <code className="text-ait-purple">VITE_MAPBOX_TOKEN</code> для спутниковой карты
          Mapbox
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("w-full", className)} style={{ height, minHeight: 400 }} />
  );
}
