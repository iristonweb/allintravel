import MapboxMap, { type MapboxPlace, type MapFocus } from "@/components/maps/MapboxMap";
import YandexMap from "@/components/maps/YandexMap";
import { cn } from "@/lib/utils";

export type TravelMapPlace = MapboxPlace;

type TravelMapProps = {
  places?: TravelMapPlace[];
  className?: string;
  height?: string;
  showRoute?: boolean;
  showDemoMarkers?: boolean;
  onPlaceClick?: (place: TravelMapPlace) => void;
  mapFocus?: MapFocus | null;
  showDestinationPin?: boolean;
  routeGeometry?: [number, number][];
};

function mapProvider(): "yandex" | "mapbox" | "leaflet" {
  if (import.meta.env.VITE_YANDEX_MAPS_API_KEY) return "yandex";
  if (import.meta.env.VITE_MAPBOX_TOKEN) return "mapbox";
  return "leaflet";
}

export default function TravelMap(props: TravelMapProps) {
  const provider = mapProvider();

  if (provider === "yandex") {
    return <YandexMap {...props} className={cn(props.className)} />;
  }

  if (provider === "mapbox") {
    return <MapboxMap {...props} className={cn(props.className)} />;
  }

  return <MapboxMap {...props} className={cn(props.className)} />;
}
