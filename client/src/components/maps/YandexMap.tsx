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
  onPlaceClick?: (place: YandexPlace) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YMap = any;

export default function YandexMap({
  places = [],
  className,
  height = "100%",
  showRoute,
  onPlaceClick,
}: YandexMapProps) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMap | null>(null);
  const objectsRef = useRef<YMap[]>([]);

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
        const center: number[] =
          validPlaces.length > 0
            ? [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)]
            : [64.9631, -19.0208];

        const map = new ymaps.Map(
          containerRef.current,
          {
            center,
            zoom: validPlaces.length === 1 ? 10 : 4,
            controls: ["zoomControl", "fullscreenControl"],
          },
          { suppressMapOpenBlock: true },
        );

        mapRef.current = map;
      })
      .catch((err) => console.error("Yandex Maps init error:", err));

    return () => {
      destroyed = true;
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

    objectsRef.current.forEach((obj) => {
      try {
        map.geoObjects.remove(obj);
      } catch {
        /* ignore */
      }
    });
    objectsRef.current = [];

    validPlaces.forEach((place, index) => {
      const lat = Number(place.latitude);
      const lon = Number(place.longitude);
      const placemark = new ymaps.Placemark(
        [lat, lon],
        {
          balloonContentHeader: place.name,
          balloonContentBody: place.address ?? "",
          hintContent: place.name,
        },
        {
          preset: "islands#violetCircleDotIconWithCaption",
          iconCaption: showRoute ? String(index + 1) : undefined,
        },
      );

      placemark.events.add("click", () => onPlaceClick?.(place));
      map.geoObjects.add(placemark);
      objectsRef.current.push(placemark);
    });

    if (showRoute && validPlaces.length > 1) {
      const lineCoords = validPlaces.map((p) => [Number(p.latitude), Number(p.longitude)]);
      const polyline = new ymaps.Polyline(
        lineCoords,
        {},
        { strokeColor: "#22D3EE", strokeWidth: 4, strokeOpacity: 0.85 },
      );
      map.geoObjects.add(polyline);
      objectsRef.current.push(polyline);
    }

    if (validPlaces.length > 1 && map.geoObjects.getBounds) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
      }
    }
  }, [validPlaces, showRoute, onPlaceClick, apiKey]);

  if (!apiKey) {
    return (
      <PlaceMap
        places={validPlaces}
        height={height}
        showRoute={showRoute}
        glowMarkers
        numberedMarkers={showRoute}
        routeGlow={showRoute}
        onPlaceClick={onPlaceClick}
        className={cn("h-full border-0", className)}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full rounded-[20px] overflow-hidden", className)}
      style={{ height, minHeight: 400 }}
    />
  );
}
