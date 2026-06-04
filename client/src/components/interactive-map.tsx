import TravelMap, { type TravelMapPlace } from "@/components/maps/TravelMap";
import { cn } from "@/lib/utils";

import type { MapFocus } from "@/components/maps/MapboxMap";

interface InteractiveMapProps {
  places: TravelMapPlace[];
  onPlaceClick?: (place: TravelMapPlace) => void;
  fullHeight?: boolean;
  showDemoMarkers?: boolean;
  mapFocus?: MapFocus | null;
  showDestinationPin?: boolean;
  filterType?: string;
}

export function InteractiveMap({
  places = [],
  onPlaceClick,
  fullHeight,
  showDemoMarkers,
  mapFocus,
  showDestinationPin,
  filterType = "all",
}: InteractiveMapProps) {
  const filteredPlaces = places.filter(
    (place) => filterType === "all" || place.type === filterType,
  );

  return (
    <div className={cn("relative w-full", fullHeight && "h-full min-h-[500px]")}>
      <TravelMap
        places={filteredPlaces}
        showDemoMarkers={showDemoMarkers ?? filteredPlaces.length === 0}
        height={fullHeight ? "100%" : "28rem"}
        onPlaceClick={onPlaceClick}
        mapFocus={mapFocus}
        showDestinationPin={showDestinationPin}
        className={cn(fullHeight && "h-full min-h-[calc(100vh-5rem)] rounded-none")}
      />
    </div>
  );
}

export default InteractiveMap;
