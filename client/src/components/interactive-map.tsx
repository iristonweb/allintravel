import { useState } from "react";
import { Button } from "@/components/ui/button";
import PlaceMap, { type MapPlace } from "@/components/PlaceMap";
import { cn } from "@/lib/utils";

interface InteractiveMapProps {
  places: MapPlace[];
  onPlaceClick?: (place: MapPlace) => void;
  fullHeight?: boolean;
}

const placeTypes = ["all", "hotel", "restaurant", "attraction", "tour"];
const typeLabels: Record<string, string> = {
  all: "Все",
  hotel: "Отели",
  restaurant: "Рестораны",
  attraction: "Активности",
  tour: "Туры",
};

export function InteractiveMap({ places = [], onPlaceClick, fullHeight }: InteractiveMapProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredPlaces = places.filter(
    (place) => filterType === "all" || place.type === filterType,
  );

  return (
    <div className={cn("relative w-full", fullHeight && "h-full")}>
      <div className="absolute top-24 left-4 z-[1000] flex flex-wrap gap-2 max-w-[90%]">
        {placeTypes.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={filterType === type ? "default" : "secondary"}
            onClick={() => setFilterType(type)}
            className={cn(
              "rounded-full text-xs",
              filterType === type
                ? "bg-ait-gradient-cta text-white border-0 hover:opacity-90"
                : "ait-glass border-white/10 bg-background/60",
            )}
          >
            {typeLabels[type]}
          </Button>
        ))}
      </div>
      <PlaceMap
        places={filteredPlaces}
        height={fullHeight ? "100%" : "24rem"}
        onPlaceClick={onPlaceClick}
        className={cn(fullHeight && "rounded-none border-0 h-full")}
        glowMarkers
      />
    </div>
  );
}

export default InteractiveMap;
