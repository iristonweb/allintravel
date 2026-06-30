import { useCallback, useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useLocation, useSearch } from "wouter";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import AppLayout from "@/components/app-layout";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";

import InteractiveMap from "@/components/interactive-map";

import DestinationCard from "@/components/brand/destination-card";

import MapSearchPanel from "@/components/map/MapSearchPanel";

import { resolveMapHref } from "@/lib/map-navigate";

import { useTranslation } from "react-i18next";
import type { Place } from "@shared/schema";
import { MAP_SHOWCASE_DESTINATIONS } from "@/lib/marketing-images";

const showcaseDestinations = [...MAP_SHOWCASE_DESTINATIONS];

export function MapPage() {
  const { t } = useTranslation();
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

  const {
    data: poiResponse,
    isFetching: poisLoading,
    isError: poisError,
    refetch: refetchPois,
  } = useQuery<{ places: Place[] }>({
    queryKey: [
      "/api/map/pois",

      {
        q: activeSearch,

        type: filterType,

        ...(mapFocus && { lat: mapFocus.lat, lon: mapFocus.lon }),
      },
    ],

    enabled: activeSearch.length >= 2,
  });

  const places = poiResponse?.places ?? [];

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

  const showPlacesHint = activeSearch.length >= 2 && mapPlaces.length === 0 && !poisLoading;

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
        <div className="absolute top-[calc(var(--ait-header-h)+5rem)] left-3 right-3 md:left-[calc(72px+1rem)] md:right-8 z-50 pointer-events-none flex justify-center">
          <motion.div
            className="w-full"
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

            {poisError && activeSearch.length >= 2 && (
              <div className="mt-2 pointer-events-auto">
                <EmptyState
                  icon={AlertCircle}
                  title={t("mapPage.loadError")}
                  description={t("mapPage.loadErrorHint")}
                  action={
                    <Button variant="outline" size="sm" onClick={() => refetchPois()}>
                      {t("common.retry")}
                    </Button>
                  }
                  className="py-4"
                />
              </div>
            )}

            {geocoding && (
              <p className="text-xs text-slate-400 mt-1 px-1 pointer-events-none">
                {t("mapPage.geocoding")}
              </p>
            )}
          </motion.div>
        </div>

        <InteractiveMap
          places={mapPlaces}
          fullHeight
          filterType={filterType}
          showDemoMarkers={mapPlaces.length === 0 && !mapFocus && activeSearch.length < 2}
          mapFocus={mapFocus}
          showDestinationPin={mapFocus != null}
          onPlaceClick={(place) => {
            if (String(place.id).startsWith("osm-")) return;
            navigate(`/place/${place.id}`);
          }}
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
