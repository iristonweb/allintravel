import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export type MapPlace = {
  id: string;
  name: string;
  type?: string;
  latitude: number | string | null;
  longitude: number | string | null;
  averageRating?: number | string | null;
  priceRange?: string | null;
  address?: string | null;
};

type PlaceMapProps = {
  places?: MapPlace[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showRoute?: boolean;
  numberedMarkers?: boolean;
  routeGlow?: boolean;
  onPlaceClick?: (place: MapPlace) => void;
  className?: string;
  glowMarkers?: boolean;
  /** Road geometry [lng, lat] — when set, draws along roads instead of straight segments */
  routeGeometry?: [number, number][];
};

const purpleIcon = L.divIcon({
  className: "ait-map-marker",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#ec4899);box-shadow:0 0 12px rgba(139,92,246,0.8);border:2px solid white;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function numberedIcon(n: number) {
  return L.divIcon({
    className: "ait-map-marker-num",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:white;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(34,211,238,0.5);border:2px solid rgba(34,211,238,0.6);">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ places }: { places: MapPlace[] }) {
  const map = useMap();
  useEffect(() => {
    const coords = places
      .map((p) => {
        const lat = Number(p.latitude);
        const lng = Number(p.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return [lat, lng] as [number, number];
      })
      .filter(Boolean) as [number, number][];
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
  }, [map, places]);
  return null;
}

const typeLabels: Record<string, string> = {
  restaurant: "Ресторан",
  hotel: "Отель",
  attraction: "Достопримечательность",
};

export default function PlaceMap({
  places = [],
  center = [48.8566, 2.3522],
  zoom = 4,
  height = "24rem",
  showRoute = false,
  numberedMarkers = false,
  routeGlow = false,
  onPlaceClick,
  className = "",
  glowMarkers = false,
  routeGeometry,
}: PlaceMapProps) {
  const validPlaces = useMemo(
    () =>
      places.filter((p) => {
        const lat = Number(p.latitude);
        const lng = Number(p.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [places],
  );

  const routeCoords = useMemo(() => {
    if (routeGeometry && routeGeometry.length > 1) {
      return routeGeometry.map(([lng, lat]) => [lat, lng] as [number, number]);
    }
    return validPlaces.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
  }, [validPlaces, routeGeometry]);

  const drawRoute = showRoute && routeCoords.length > 1 && (routeGeometry?.length ?? 0) > 1;

  const mapCenter: [number, number] =
    validPlaces.length === 1
      ? [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)]
      : center;

  return (
    <div
      className={`overflow-hidden rounded-[var(--ait-radius-card)] border border-border ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {validPlaces.length > 1 && <FitBounds places={validPlaces} />}
        {drawRoute && (
          <Polyline
            positions={routeCoords}
            color={routeGlow ? "#22d3ee" : "var(--ait-primary)"}
            weight={routeGlow ? 4 : 3}
            opacity={0.9}
            className={routeGlow ? "ait-glow-route" : undefined}
          />
        )}
        {validPlaces.map((place, index) => {
          const lat = Number(place.latitude);
          const lng = Number(place.longitude);
          const rating = Number(place.averageRating ?? 0);
          const icon = numberedMarkers
            ? numberedIcon(index + 1)
            : glowMarkers
              ? purpleIcon
              : defaultIcon;
          return (
            <Marker
              key={place.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => onPlaceClick?.(place),
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-2">
                  <p className="font-semibold text-sm">{place.name}</p>
                  {place.type && (
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[place.type] || place.type}
                    </Badge>
                  )}
                  {rating > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {rating.toFixed(1)}
                    </div>
                  )}
                  {place.address && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{place.address}</p>
                  )}
                  {!String(place.id).startsWith("osm-") ? (
                    <Link href={`/place/${place.id}`}>
                      <Button size="sm" className="w-full mt-1 bg-primary hover:bg-primary/90">
                        Подробнее
                      </Button>
                    </Link>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Источник: OpenStreetMap</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export { PlaceMap };
