import { useCallback, useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useLocation, useSearch } from "wouter";

import { motion } from "framer-motion";

import AppLayout from "@/components/app-layout";

import InteractiveMap from "@/components/interactive-map";

import DestinationCard from "@/components/brand/destination-card";

import MapSearchPanel from "@/components/map/MapSearchPanel";

import { resolveMapHref } from "@/lib/map-navigate";

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

  const urlType = urlParams.get("type") ?? "all";



  const [search, setSearch] = useState(urlQuery);

  const [filterType, setFilterType] = useState(urlType);

  const [geocoding, setGeocoding] = useState(false);



  useEffect(() => {

    setSearch(urlQuery);

  }, [urlQuery]);



  useEffect(() => {

    setFilterType(urlType);

  }, [urlType]);



  const mapFocus = useMemo(() => {

    const lat = urlLat != null ? Number(urlLat) : NaN;

    const lon = urlLon != null ? Number(urlLon) : NaN;

    if (Number.isFinite(lat) && Number.isFinite(lon)) {

      return { lat, lon, zoom: 10, label: urlQuery || undefined };

    }

    return null;

  }, [urlLat, urlLon, urlQuery]);



  const activeSearch = search.trim() || urlQuery.trim();



  const { data: places = [] } = useQuery<Place[]>({

    queryKey: [

      "/api/places",

      {

        limit: 50,

        ...(activeSearch && { search: activeSearch }),

        ...(filterType !== "all" && { type: filterType }),

      },

    ],

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



  const showPlacesHint =

    Boolean(activeSearch) &&

    mapPlaces.length === 0 &&

    mapFocus != null;



  const handleMapNavigate = useCallback(

    async (href: string) => {

      if (href.startsWith("/place/")) {

        navigate(href);

        return;

      }

      if (href.startsWith("/places")) {

        const params = new URLSearchParams(href.split("?")[1] ?? "");

        const q = params.get("search")?.trim();

        if (q) {

          const mapParams = new URLSearchParams({ q });

          const type = params.get("type");

          if (type && type !== "all") mapParams.set("type", type);

          await handleMapNavigate(`/map?${mapParams.toString()}`);

          return;

        }

      }

      if (href.startsWith("/map")) {

        setGeocoding(true);

        try {

          const resolved = await resolveMapHref(href);

          navigate(resolved);

        } finally {

          setGeocoding(false);

        }

        return;

      }

      navigate(href);

    },

    [navigate],

  );



  const handleFilterChange = (type: string) => {

    setFilterType(type);

    const params = new URLSearchParams(searchString);

    if (type === "all") params.delete("type");

    else params.set("type", type);

    navigate(`/map?${params.toString()}`);

  };



  return (

    <AppLayout fullWidth immersive contentClassName="p-0">

      <div className="relative h-[calc(100vh-var(--ait-header-h))] min-h-[600px]">

        <div className="absolute top-[calc(var(--ait-header-h)+0.75rem)] left-4 right-4 md:left-[calc(1rem+72px)] z-50 pointer-events-none">

          <motion.div

            initial={{ opacity: 0, y: -12 }}

            animate={{ opacity: 1, y: 0 }}

          >

            <MapSearchPanel

              search={search}

              onSearchChange={setSearch}

              onNavigate={handleMapNavigate}

              filterType={filterType}

              onFilterTypeChange={handleFilterChange}

              showPlacesHint={showPlacesHint}

            />

            {geocoding && (

              <p className="text-xs text-slate-400 mt-1 px-1 pointer-events-none">Определяем координаты…</p>

            )}

          </motion.div>

        </div>



        <InteractiveMap

          places={mapPlaces}

          fullHeight

          filterType={filterType}

          showDemoMarkers={mapPlaces.length === 0 && !mapFocus}

          mapFocus={mapFocus}

          showDestinationPin={mapFocus != null}

          onPlaceClick={(place) => navigate(`/place/${place.id}`)}

        />



        <div className="absolute bottom-24 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">

          <div className="relative pointer-events-auto">

            <div

              className="absolute inset-y-0 left-0 w-8 md:w-12 z-10 pointer-events-none bg-gradient-to-r from-[#050816] to-transparent"

              aria-hidden

            />

            <div

              className="absolute inset-y-0 right-0 w-8 md:w-12 z-10 pointer-events-none bg-gradient-to-l from-[#050816] to-transparent"

              aria-hidden

            />

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              {showcaseDestinations.map((d) => (

                <DestinationCard

                  key={d.id}

                  destination={d}

                  className="snap-start shrink-0"

                  onClick={() => handleMapNavigate(`/map?q=${encodeURIComponent(d.name)}`)}

                />

              ))}

            </div>

          </div>

        </div>

      </div>

    </AppLayout>

  );

}



export default MapPage;

