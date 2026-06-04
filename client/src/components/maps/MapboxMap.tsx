import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import PlaceMap, { type MapPlace } from "@/components/PlaceMap";
import { cn } from "@/lib/utils";

export type MapboxPlace = MapPlace;

type MapboxMapProps = {
  places?: MapboxPlace[];
  className?: string;
  height?: string;
  showRoute?: boolean;
  onPlaceClick?: (place: MapboxPlace) => void;
};

const DEMO_ROUTES: [number, number][][] = [
  [
    [-21.95, 64.15],
    [12.57, 55.68],
    [2.35, 48.86],
  ],
  [
    [-118.24, 34.05],
    [-73.98, 40.71],
    [-0.12, 51.5],
  ],
];

export default function MapboxMap({
  places = [],
  className,
  height = "100%",
  showRoute,
  onPlaceClick,
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
      style: "mapbox://styles/mapbox/dark-v11",
      center: [10, 30],
      zoom: 1.8,
      pitch: 24,
      bearing: -8,
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
          id: `${id}-line`,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": i === 0 ? "#8b5cf6" : "#ff7a18",
            "line-width": 2,
            "line-opacity": 0.65,
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

    validPlaces.forEach((place) => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-150";
      el.style.background = "linear-gradient(135deg, #8b5cf6, #ff7a18)";
      el.style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.8)";
      el.style.border = "2px solid white";
      el.addEventListener("click", () => onPlaceClick?.(place));

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
        `<div style="padding:4px 0"><strong>${place.name}</strong></div>`,
      );

      markers.push(
        new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(map),
      );
    });

    if (validPlaces.length > 1 && showRoute) {
      const coords = validPlaces.map(
        (p) => [Number(p.longitude), Number(p.latitude)] as [number, number],
      );
      const routeId = "trip-route";
      const data = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: coords },
      };
      if (map.getSource(routeId)) {
        (map.getSource(routeId) as mapboxgl.GeoJSONSource).setData(data);
      } else {
        map.addSource(routeId, { type: "geojson", data });
        map.addLayer({
          id: `${routeId}-line`,
          type: "line",
          source: routeId,
          paint: { "line-color": "#22d3ee", "line-width": 4, "line-opacity": 0.9 },
        });
      }
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }

    return () => markers.forEach((m) => m.remove());
  }, [validPlaces, ready, onPlaceClick, showRoute, token]);

  if (!token) {
    return (
      <div className={cn("relative", className)} style={{ height }}>
        <PlaceMap
          places={validPlaces}
          height={height}
          showRoute={showRoute}
          glowMarkers
          numberedMarkers={showRoute}
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
