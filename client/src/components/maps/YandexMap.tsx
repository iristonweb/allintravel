import { useEffect, useRef } from "react";
import { loadYandexMaps } from "@/lib/yandexMapsLoader";
import type { MapPlace } from "@/components/PlaceMap";
import PlaceMap from "@/components/PlaceMap";
import { cn } from "@/lib/utils";

export type YandexPlace = MapPlace;

type YandexMapProps = {
  places?: YandexPlace[];
  className?: string;
  height?: string;
  showRoute?: boolean;
  showDemoMarkers?: boolean;
  onPlaceClick?: (place: YandexPlace) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YMap = any;

const DEMO_ROUTES: [number, number][][] = [
  [
    [64.15, -21.95],
    [55.68, 12.57],
    [48.86, 2.35],
    [35.68, 139.69],
  ],
  [
    [34.05, -118.24],
    [40.71, -73.98],
    [51.5, -0.12],
    [-31.95, 115.86],
  ],
];

const DEMO_MARKERS: { lat: number; lon: number; label: string; variant: string }[] = [
  { lat: 64.15, lon: -21.95, label: "12", variant: "purple" },
  { lat: 55.68, lon: 12.57, label: "8", variant: "green" },
  { lat: 48.86, lon: 2.35, label: "24", variant: "orange" },
  { lat: 35.68, lon: 139.69, label: "16", variant: "purple" },
  { lat: 40.71, lon: -73.98, label: "5", variant: "orange" },
  { lat: -31.95, lon: 115.86, label: "9", variant: "green" },
];

const markerLayouts: Record<string, YMap> = {};

function getMarkerLayout(ymaps: YMap, variant: string): YMap {
  if (!markerLayouts[variant]) {
    markerLayouts[variant] = ymaps.templateLayoutFactory.createClass(
      `<div class="ait-map-marker ait-map-marker--${variant}">$[properties.iconContent]</div>`,
    );
  }
  return markerLayouts[variant];
}

export default function YandexMap({
  places = [],
  className,
  height = "100%",
  showRoute,
  showDemoMarkers,
  onPlaceClick,
}: YandexMapProps) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMap | null>(null);
  const dynamicObjectsRef = useRef<YMap[]>([]);

  const validPlaces = places.filter((p) => {
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let destroyed = false;

    loadYandexMaps(apiKey)
      .then(() => {
        if (destroyed || !containerRef.current || !window.ymaps) return;

        const ymaps = window.ymaps;
        const center: [number, number] =
          validPlaces.length > 0
            ? [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)]
            : [30, 10];

        const map = new ymaps.Map(
          containerRef.current,
          {
            center,
            zoom: validPlaces.length === 1 ? 10 : 2,
            controls: ["zoomControl", "fullscreenControl"],
            type: "yandex#satellite",
          },
          {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true,
          },
        );

        mapRef.current = map;

        DEMO_ROUTES.forEach((coords, i) => {
          const line = new ymaps.Polyline(
            coords,
            {},
            {
              strokeColor: i === 0 ? "#8B5CF6" : "#FF7A18",
              strokeWidth: 3,
              strokeOpacity: 0.75,
              strokeStyle: "shortdash",
            },
          );
          map.geoObjects.add(line);
        });
      })
      .catch((err) => console.error("Yandex Maps init error:", err));

    return () => {
      destroyed = true;
      dynamicObjectsRef.current = [];
      try {
        mapRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = window.ymaps;
    if (!map || !ymaps || !apiKey) return;

    dynamicObjectsRef.current.forEach((obj) => {
      try {
        map.geoObjects.remove(obj);
      } catch {
        /* ignore */
      }
    });
    dynamicObjectsRef.current = [];

    const addPlacemark = (
      lat: number,
      lon: number,
      label: string,
      variant: string,
      place?: YandexPlace,
    ) => {
      const placemark = new ymaps.Placemark(
        [lat, lon],
        {
          iconContent: label,
          balloonContentHeader: place?.name ?? `${label} мест`,
          balloonContentBody: place?.address ?? "",
          hintContent: place?.name ?? label,
        },
        {
          iconLayout: getMarkerLayout(ymaps, variant),
          iconShape: {
            type: "Circle",
            coordinates: [0, 0],
            radius: 20,
          },
        },
      );

      if (place && onPlaceClick) {
        placemark.events.add("click", () => onPlaceClick(place));
      }

      map.geoObjects.add(placemark);
      dynamicObjectsRef.current.push(placemark);
    };

    if (showDemoMarkers) {
      DEMO_MARKERS.forEach((m) => addPlacemark(m.lat, m.lon, m.label, m.variant));
    }

    validPlaces.forEach((place, index) => {
      const lat = Number(place.latitude);
      const lon = Number(place.longitude);
      const variants = ["purple", "orange", "green"];
      addPlacemark(lat, lon, String(index + 1), variants[index % 3], place);
    });

    if (showRoute && validPlaces.length > 1) {
      const lineCoords = validPlaces.map((p) => [Number(p.latitude), Number(p.longitude)]);
      const polyline = new ymaps.Polyline(
        lineCoords,
        {},
        {
          strokeColor: "#22D3EE",
          strokeWidth: 5,
          strokeOpacity: 0.9,
        },
      );
      map.geoObjects.add(polyline);
      dynamicObjectsRef.current.push(polyline);
    }

    if (validPlaces.length > 1 && map.geoObjects.getBounds) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
      }
    } else if (showDemoMarkers && validPlaces.length === 0) {
      map.setCenter([30, 10], 2);
    }
  }, [validPlaces, showRoute, showDemoMarkers, onPlaceClick, apiKey]);

  if (!apiKey) {
    return (
      <PlaceMap
        places={validPlaces}
        height={height}
        showRoute={showRoute}
        glowMarkers
        numberedMarkers={showRoute || showDemoMarkers}
        routeGlow={showRoute}
        onPlaceClick={onPlaceClick}
        className={cn("h-full border-0", className)}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden bg-[#050816]", className)}
      style={{ height, minHeight: 400 }}
    />
  );
}
