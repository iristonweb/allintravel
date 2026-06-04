import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import AppLayout from "@/components/app-layout";
import InteractiveMap from "@/components/interactive-map";
import DestinationCard from "@/components/brand/destination-card";
import { Search } from "lucide-react";
import type { Place } from "@shared/schema";

const showcaseDestinations = [
  {
    id: "bali",
    name: "Бали",
    imageUrl: "https://images.unsplash.com/photo-1537996195241-795aa0a07e0f?w=500&q=85",
    placesCount: 342,
    rating: 4.8,
  },
  {
    id: "iceland",
    name: "Исландия",
    imageUrl: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=500&q=85",
    placesCount: 128,
    rating: 4.9,
  },
  {
    id: "norway",
    name: "Норвегия",
    imageUrl: "https://images.unsplash.com/photo-1518837695005-2083099ee35b?w=500&q=85",
    placesCount: 96,
    rating: 4.8,
  },
  {
    id: "japan",
    name: "Япония",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e912f437?w=500&q=85",
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
    <AppLayout fullWidth immersive contentClassName="p-0">
      <div className="relative h-[calc(100vh-5rem)] min-h-[600px]">
        <div className="absolute top-4 left-4 right-4 z-[1001] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-3">
              Интерактивная карта
            </h1>
            <div className="ait-glass-strong rounded-2xl flex items-center gap-3 px-4 py-3 max-w-md">
              <Search className="h-5 w-5 text-ait-purple shrink-0" />
              <input
                placeholder="Куда вы хотите?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </motion.div>
        </div>

        <InteractiveMap
          places={mapPlaces}
          fullHeight
          onPlaceClick={(place) => navigate(`/place/${place.id}`)}
        />

        <div className="absolute bottom-24 md:bottom-8 left-0 right-0 z-[1001] px-4 pointer-events-none">
          <div className="pointer-events-auto flex gap-4 overflow-x-auto pb-2 snap-x">
            {showcaseDestinations.map((d) => (
              <DestinationCard
                key={d.id}
                destination={d}
                className="snap-start"
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
