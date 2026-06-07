import { useEffect, useRef } from "react";
import { loadYandexMaps } from "@/lib/yandexMapsLoader";
import type { MapPlace } from "@/components/PlaceMap";
import PlaceMap from "@/components/PlaceMap";
import type { MapFocus } from "@/components/maps/MapboxMap";
import { cn } from "@/lib/utils";
import { demoMarkersYandex, demoRoutesYandex } from "@/lib/map-demo-data";

export type YandexPlace = MapPlace;

type YandexMapProps = {
  places?: YandexPlace[];
  className?: string;
  height?: string;
  showRoute?: boolean;
  showDemoMarkers?: boolean;
  mapFocus?: MapFocus | null;
  showDestinationPin?: boolean;
  onPlaceClick?: (place: YandexPlace) => void;
  /** Road geometry from Yandex Router API as [lng, lat] pairs */
  routeGeometry?: [number, number][];
};

function resolveInitialView(
  mapFocus: MapFocus | null | undefined,
  validPlaces: YandexPlace[],
  showDemoMarkers?: boolean,
): { center: [number, number]; zoom: number } {
  if (mapFocus && Number.isFinite(mapFocus.lat) && Number.isFinite(mapFocus.lon)) {
    return {
      center: [mapFocus.lat, mapFocus.lon],
      zoom: mapFocus.zoom ?? 10,
    };
  }
  if (validPlaces.length > 0) {
    return {
      center: [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)],
      zoom: validPlaces.length === 1 ? 10 : 4,
    };
  }
  if (showDemoMarkers) {
    return { center: [30, 10], zoom: 2 };
  }
  return { center: [30, 10], zoom: 4 };
}

type YMap = any;

const DEMO_ROUTES = demoRoutesYandex();
const DEMO_MARKERS = demoMarkersYandex();

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
  mapFocus,
  showDestinationPin,
  onPlaceClick,
  routeGeometry,
}: YandexMapProps) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMap | null>(null);
  const dynamicObjectsRef = useRef<YMap[]>([]);
  const demoRoutesRef = useRef<YMap[]>([]);

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
        const { center, zoom } = resolveInitialView(mapFocus, validPlaces, showDemoMarkers);

        const map = new ymaps.Map(
          containerRef.current,
          {
            center,
            zoom,
            controls: ["zoomControl", "fullscreenControl"],
            type: "yandex#satellite",
          },
          {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true,
          },
        );

        mapRef.current = map;
      })
      .catch((err) => console.error("Yandex Maps init error:", err));

    return () => {
      destroyed = true;
      dynamicObjectsRef.current = [];
      demoRoutesRef.current = [];
      try {
        mapRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
    };
    // Map instance is created once per API key; follow-up effects sync markers/focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single init
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapFocus) return;
    const { lat, lon, zoom = 10 } = mapFocus;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    map.setCenter([lat, lon], zoom, { duration: 300 });
  }, [mapFocus, apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = window.ymaps;
    if (!map || !ymaps || !apiKey) return;

    demoRoutesRef.current.forEach((obj) => {
      try {
        map.geoObjects.remove(obj);
      } catch {
        /* ignore */
      }
    });
    demoRoutesRef.current = [];

    if (showDemoMarkers) {
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
        demoRoutesRef.current.push(line);
      });
    }

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

    if (
      showDestinationPin &&
      mapFocus &&
      Number.isFinite(mapFocus.lat) &&
      Number.isFinite(mapFocus.lon)
    ) {
      const focusPlacemark = new ymaps.Placemark(
        [mapFocus.lat, mapFocus.lon],
        {
          balloonContentHeader: mapFocus.label ?? "Направление",
          hintContent: mapFocus.label ?? "Выбранное место",
        },
        {
          preset: "islands#violetDotIcon",
        },
      );
      map.geoObjects.add(focusPlacemark);
      dynamicObjectsRef.current.push(focusPlacemark);
    }

    validPlaces.forEach((place, index) => {
      const lat = Number(place.latitude);
      const lon = Number(place.longitude);
      const variants = ["purple", "orange", "green"];
      addPlacemark(lat, lon, String(index + 1), variants[index % 3], place);
    });

    if (showRoute) {
      const roadCoords =
        routeGeometry && routeGeometry.length > 1
          ? routeGeometry.map(([lng, lat]) => [lat, lng] as [number, number])
          : null;

      if (roadCoords && roadCoords.length > 1) {
        const polyline = new ymaps.Polyline(
          roadCoords,
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
    }

    if (mapFocus && Number.isFinite(mapFocus.lat) && Number.isFinite(mapFocus.lon)) {
      map.setCenter([mapFocus.lat, mapFocus.lon], mapFocus.zoom ?? 10, { duration: 300 });
    } else if (validPlaces.length > 1 && map.geoObjects.getBounds) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
      }
    } else if (validPlaces.length === 1) {
      const p = validPlaces[0];
      map.setCenter([Number(p.latitude), Number(p.longitude)], 10, { duration: 300 });
    } else if (showDemoMarkers && validPlaces.length === 0) {
      map.setCenter([30, 10], 2);
    }
  }, [
    validPlaces,
    showRoute,
    showDemoMarkers,
    mapFocus,
    showDestinationPin,
    onPlaceClick,
    routeGeometry,
    apiKey,
  ]);

  if (!apiKey) {
    return (
      <PlaceMap
        places={validPlaces}
        height={height}
        showRoute={showRoute}
        glowMarkers
        numberedMarkers={showRoute || showDemoMarkers}
        routeGlow={showRoute}
        routeGeometry={routeGeometry}
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
