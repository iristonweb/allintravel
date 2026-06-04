import { useState } from "react";
import { Button } from "@/components/ui/button";
import TravelMap, { type TravelMapPlace } from "@/components/maps/TravelMap";
import { cn } from "@/lib/utils";

interface InteractiveMapProps {
  places: TravelMapPlace[];
  onPlaceClick?: (place: TravelMapPlace) => void;
  fullHeight?: boolean;
  showDemoMarkers?: boolean;
}

const placeTypes = ["all", "hotel", "restaurant", "attraction", "tour"];
const typeLabels: Record<string, string> = {
  all: "Все",
  hotel: "Отели",
  restaurant: "Рестораны",
  attraction: "Активности",
  tour: "Туры",
};

export function InteractiveMap({
  places = [],
  onPlaceClick,
  fullHeight,
  showDemoMarkers,
}: InteractiveMapProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredPlaces = places.filter(
    (place) => filterType === "all" || place.type === filterType,
  );

  return (
    <div className={cn("relative w-full", fullHeight && "h-full min-h-[500px]")}>
      <div className="absolute top-28 left-4 z-[1000] flex flex-wrap gap-2 max-w-[90%]">
        {placeTypes.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={filterType === type ? "default" : "secondary"}
            onClick={() => setFilterType(type)}
            className={cn(
              "rounded-full text-xs font-medium",
              filterType === type
                ? "ait-btn-glow border-0 text-white"
                : "ait-glass border-white/10 bg-transparent text-slate-300 hover:text-white",
            )}
          >
            {typeLabels[type]}
          </Button>
        ))}
      </div>
      <TravelMap
        places={filteredPlaces}
        showDemoMarkers={showDemoMarkers ?? filteredPlaces.length === 0}
        height={fullHeight ? "100%" : "28rem"}
        onPlaceClick={onPlaceClick}
        className={cn(fullHeight && "h-full min-h-[calc(100vh-5rem)] rounded-none")}
      />
    </div>
  );
}

export default InteractiveMap;
