import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import InteractiveMap from "@/components/interactive-map";
import DestinationCard, { type DestinationCardData } from "@/components/brand/destination-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Place } from "@shared/schema";

const showcaseDestinations: DestinationCardData[] = [
  {
    id: "bali",
    name: "Бали",
    imageUrl: "https://images.unsplash.com/photo-1537996195241-795aa0a07e0f?w=400&q=80",
    placesCount: 342,
    rating: 4.8,
  },
  {
    id: "iceland",
    name: "Исландия",
    imageUrl: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=400&q=80",
    placesCount: 128,
    rating: 4.9,
  },
  {
    id: "peru",
    name: "Перу",
    imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&q=80",
    placesCount: 89,
    rating: 4.7,
  },
  {
    id: "italy",
    name: "Италия",
    imageUrl: "https://images.unsplash.com/photo-1516483638264-f4dbaf3a0e3a?w=400&q=80",
    placesCount: 512,
    rating: 4.8,
  },
  {
    id: "japan",
    name: "Япония",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e912f437?w=400&q=80",
    placesCount: 276,
    rating: 4.9,
  },
];

export function MapPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 50, ...(search && { search }) }],
  });

  const mapPlaces = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type ?? undefined,
      latitude: p.latitude,
      longitude: p.longitude,
      averageRating: p.averageRating,
      priceRange: p.priceRange,
      address: p.address,
    }));

  return (
    <AppLayout fullWidth>
      <div className="relative flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
        <div className="absolute top-0 left-0 right-0 z-[1001] p-4 md:pl-4 space-y-3 pointer-events-none">
          <div className="pointer-events-auto max-w-3xl mx-auto md:mx-0 md:ml-0">
            <h1 className="text-2xl font-bold text-foreground drop-shadow-lg">
              Интерактивная карта
            </h1>
            <div className="relative mt-2 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Куда вы хотите?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 ait-glass-strong border-white/10 bg-background/80"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <InteractiveMap
            places={mapPlaces}
            fullHeight
            onPlaceClick={(place) => navigate(`/place/${place.id}`)}
          />
        </div>

        <div className="absolute bottom-20 md:bottom-4 left-0 right-0 z-[1001] px-4 pointer-events-none">
          <div className="pointer-events-auto flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {showcaseDestinations.map((d) => (
              <DestinationCard
                key={d.id}
                destination={d}
                onClick={() => navigate("/places")}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default MapPage;
