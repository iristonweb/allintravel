import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Crosshair, Utensils, Building, Camera } from "lucide-react";
import type { Place } from "@shared/schema";

interface InteractiveMapProps {
  places: Place[];
}

interface MapMarker {
  id: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  top: number;
  left: number;
}

export default function InteractiveMap({ places }: InteractiveMapProps) {
  const [zoom, setZoom] = useState(1);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    // Convert places to map markers with pseudo-random positions for demo
    const mapMarkers = places.slice(0, 10).map((place, index) => {
      // Generate pseudo-random positions based on place id for consistency
      const hash = place.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const top = Math.abs(hash % 300) + 50; // 50-350px from top
      const left = Math.abs((hash * 7) % 400) + 50; // 50-450px from left
      
      return {
        id: place.id,
        type: place.type,
        name: place.name,
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
        top,
        left,
      };
    });
    
    setMarkers(mapMarkers);
  }, [places]);

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "restaurant":
        return <Utensils className="text-sm" />;
      case "hotel":
        return <Building className="text-sm" />;
      case "attraction":
        return <Camera className="text-sm" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-white" />;
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "restaurant":
        return "bg-primary";
      case "hotel":
        return "bg-secondary";
      case "attraction":
        return "bg-accent";
      default:
        return "bg-gray-500";
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Interactive Map</h2>
        <Button variant="outline" className="flex items-center space-x-2">
          <span>List View</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-96 bg-gray-100 overflow-hidden">
            {/* Map Background */}
            <div 
              className="absolute inset-0 transition-transform duration-300"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `scale(${zoom})`,
              }}
            />
            
            {/* Blue overlay for map feel */}
            <div className="absolute inset-0 bg-blue-900 bg-opacity-20" />

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomIn}
                className="bg-white shadow-md hover:shadow-lg w-10 h-10 p-0"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomOut}
                className="bg-white shadow-md hover:shadow-lg w-10 h-10 p-0"
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white shadow-md hover:shadow-lg w-10 h-10 p-0"
              >
                <Crosshair className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            {/* Map Markers */}
            {markers.map((marker) => (
              <div
                key={marker.id}
                className={`absolute w-8 h-8 ${getMarkerColor(marker.type)} text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-20 group`}
                style={{
                  top: `${marker.top * zoom}px`,
                  left: `${marker.left * zoom}px`,
                }}
                title={marker.name}
              >
                {getMarkerIcon(marker.type)}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {marker.name}
                </div>
              </div>
            ))}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-lg z-10">
              <div className="text-sm font-medium mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                    <Utensils className="w-2 h-2 text-white" />
                  </div>
                  <span>Restaurants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary rounded-full flex items-center justify-center">
                    <Building className="w-2 h-2 text-white" />
                  </div>
                  <span>Hotels</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent rounded-full flex items-center justify-center">
                    <Camera className="w-2 h-2 text-white" />
                  </div>
                  <span>Attractions</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
