import { useState } from "react";
import { MapPin, Star, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Place {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  priceRange: string;
  imageUrl?: string;
}

interface InteractiveMapProps {
  places: Place[];
  onPlaceClick?: (place: Place) => void;
}

export function InteractiveMap({ places = [], onPlaceClick }: InteractiveMapProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredPlaces = places.filter(place => 
    filterType === "all" || place.type === filterType
  );

  const placeTypes = ["all", "restaurant", "hotel", "attraction"];
  const typeLabels: Record<string, string> = {
    all: "Все",
    restaurant: "Рестораны",
    hotel: "Отели",
    attraction: "Достопримечательности"
  };

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place);
    onPlaceClick?.(place);
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 rounded-lg border relative overflow-hidden">
      {/* Filter buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {placeTypes.map(type => (
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

      {/* Map visualization */}
      <div className="absolute inset-0 p-8">
        <div className="relative w-full h-full bg-teal-100 dark:bg-teal-900 rounded-lg">
          {/* Simulated map markers */}
          {filteredPlaces.map((place, index) => {
            const x = (Math.abs(parseFloat(place.longitude?.toString() || "0")) % 100) * 0.8 + 10;
            const y = (Math.abs(parseFloat(place.latitude?.toString() || "0")) % 100) * 0.7 + 15;
            
            return (
              <div
                key={place.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${x}%`, 
                  top: `${y}%`,
                  zIndex: selectedPlace?.id === place.id ? 20 : 10
                }}
                onClick={() => handlePlaceClick(place)}
              >
                <div className={`relative ${selectedPlace?.id === place.id ? 'scale-125' : 'hover:scale-110'} transition-transform`}>
                  <MapPin 
                    className={`h-8 w-8 ${
                      place.type === 'restaurant' ? 'text-orange-500' :
                      place.type === 'hotel' ? 'text-blue-500' :
                      'text-green-500'
                    } drop-shadow-lg`}
                    fill="currentColor"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(place.averageRating * 10) / 10}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected place popup */}
      {selectedPlace && (
        <Card className="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              {selectedPlace.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlace(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {typeLabels[selectedPlace.type] || selectedPlace.type}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{selectedPlace.averageRating}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">{selectedPlace.priceRange}</span>
              </div>
            </div>
            <Button size="sm" className="bg-coral-500 hover:bg-coral-600">
              Подробнее
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InteractiveMap;