import { useState } from "react";
import { Button } from "@/components/ui/button";
import PlaceMap, { type MapPlace } from "@/components/PlaceMap";

interface InteractiveMapProps {
  places: MapPlace[];
  onPlaceClick?: (place: MapPlace) => void;
}

const placeTypes = ["all", "restaurant", "hotel", "attraction"];
const typeLabels: Record<string, string> = {
  all: "Все",
  restaurant: "Рестораны",
  hotel: "Отели",
  attraction: "Достопримечательности",
};

export function InteractiveMap({ places = [], onPlaceClick }: InteractiveMapProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredPlaces = places.filter(
    (place) => filterType === "all" || place.type === filterType,
  );

  return (
    <div className="relative w-full">
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2">
        {placeTypes.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={filterType === type ? "default" : "secondary"}
            onClick={() => setFilterType(type)}
            className={filterType === type ? "bg-primary hover:bg-primary/90" : ""}
          >
            {typeLabels[type]}
          </Button>
        ))}
      </div>
      <PlaceMap
        places={filteredPlaces}
        height="24rem"
        onPlaceClick={onPlaceClick}
      />
    </div>
  );
}

export default InteractiveMap;
