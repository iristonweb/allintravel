import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import AppLayout from "@/components/app-layout";
import InteractiveMap from "@/components/interactive-map";
import DestinationCard from "@/components/brand/destination-card";
import DestinationSearch from "@/components/search/DestinationSearch";
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
  const searchString = useSearch();
  const urlParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const urlQuery = urlParams.get("q") ?? "";
  const urlLat = urlParams.get("lat");
  const urlLon = urlParams.get("lon");

  const [search, setSearch] = useState(urlQuery);

  const mapFocus = useMemo(() => {
    const lat = urlLat != null ? Number(urlLat) : NaN;
    const lon = urlLon != null ? Number(urlLon) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon, zoom: 10 };
    }
    return null;
  }, [urlLat, urlLon]);

  const activeSearch = search.trim() || urlQuery.trim();

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 50, ...(activeSearch && { search: activeSearch }) }],
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
      <div className="relative h-[calc(100vh-var(--ait-header-h))] min-h-[600px]">
        <div className="absolute top-24 left-4 right-4 md:left-[calc(1rem+72px)] z-40 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-3">
              Интерактивная карта
            </h1>
            <div className="ait-glass-strong rounded-2xl p-2 max-w-md">
              <DestinationSearch
                value={search}
                onChange={setSearch}
                onNavigate={navigate}
                placeholder="Город, страна или место"
                inputClassName="ait-glass-strong border-0 bg-transparent text-white placeholder:text-slate-500"
              />
            </div>
          </motion.div>
        </div>

        <InteractiveMap
          places={mapPlaces}
          fullHeight
          showDemoMarkers={mapPlaces.length === 0 && !mapFocus}
          mapFocus={mapFocus}
          onPlaceClick={(place) => navigate(`/place/${place.id}`)}
        />

        <div className="absolute bottom-24 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="pointer-events-auto flex gap-4 overflow-x-auto pb-2 snap-x">
            {showcaseDestinations.map((d) => (
              <DestinationCard
                key={d.id}
                destination={d}
                className="snap-start"
                onClick={() =>
                  navigate(`/places?search=${encodeURIComponent(d.name)}`)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default MapPage;
