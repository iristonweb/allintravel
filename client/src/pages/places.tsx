import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import CatalogPageLayout from "@/components/layout/catalog-page-layout";
import EmptyState from "@/components/empty-state";
import PlaceCard from "@/components/places/PlaceCard";
import PlaceCardSkeleton from "@/components/places/PlaceCardSkeleton";
import StatPill from "@/components/brand/stat-pill";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, AlertCircle, Plus, Star, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import DestinationSearch from "@/components/search/DestinationSearch";
import CatalogFilterPanel from "@/components/filters/CatalogFilterPanel";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePlaceFavorites } from "@/hooks/usePlaceFavorites";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MediaUploadField from "@/components/media/MediaUploadField";
import type { Place } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export function Places() {
  const { t } = useTranslation();
  const filters = useFilterLabels();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = usePlaceFavorites();
  const [createOpen, setCreateOpen] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: "",
    description: "",
    type: "attraction",
    latitude: "",
    longitude: "",
    address: "",
    priceRange: "$$",
    imageUrl: "",
  });

  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get("search") ?? "";
  const initialType = urlParams.get("type") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [minRating, setMinRating] = useState("");
  const [priceRange, setPriceRange] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const q = params.get("search") ?? "";
    const t = params.get("type") ?? "";
    setSearch(q);
    setActiveSearch(q);
    setTypeFilter(t);
  }, [searchString]);

  const {
    data: places = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Place[]>({
    queryKey: [
      "/api/places",
      {
        limit: 100,
        offset: 0,
        ...(activeSearch && { search: activeSearch }),
        ...(typeFilter && { type: typeFilter }),
        ...(minRating && { minRating: Number(minRating) }),
        ...(priceRange && { priceRange }),
      },
    ],
  });

  const applySearch = (q: string) => {
    const trimmed = q.trim();
    setSearch(trimmed);
    setActiveSearch(trimmed);
    const params = new URLSearchParams();
    if (trimmed) params.set("search", trimmed);
    if (typeFilter) params.set("type", typeFilter);
    const qs = params.toString();
    navigate(qs ? `/places?${qs}` : "/places");
  };

  const createPlaceMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/places", {
        ...newPlace,
        latitude: newPlace.latitude || "0",
        longitude: newPlace.longitude || "0",
        imageUrl: newPlace.imageUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setCreateOpen(false);
      setNewPlace({
        name: "",
        description: "",
        type: "attraction",
        latitude: "",
        longitude: "",
        address: "",
        priceRange: "$$",
        imageUrl: "",
      });
      toast({ title: t("places.saved") });
    },
    onError: () => {
      toast({ title: t("places.saveFailed"), variant: "destructive" });
    },
  });

  const clearFilters = () => {
    setSearch("");
    setActiveSearch("");
    setTypeFilter("");
    setMinRating("");
    setPriceRange("");
  };

  const hasActiveFilters = activeSearch || typeFilter || minRating || priceRange;

  const createPlaceDialog = isAuthenticated ? (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <AitButton variant="primary" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {t("places.addPlace")}
        </AitButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("places.newPlace")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={t("places.form.name")}
            value={newPlace.name}
            onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
          />
          <Textarea
            placeholder={t("places.form.description")}
            value={newPlace.description}
            onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
          />
          <select
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            value={newPlace.type}
            onChange={(e) => setNewPlace({ ...newPlace, type: e.target.value })}
          >
            {filters.placeType
              .filter((opt) => opt.value)
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
          <Input
            placeholder={t("places.form.address")}
            value={newPlace.address}
            onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder={t("places.form.latitude")}
              value={newPlace.latitude}
              onChange={(e) => setNewPlace({ ...newPlace, latitude: e.target.value })}
            />
            <Input
              placeholder={t("places.form.longitude")}
              value={newPlace.longitude}
              onChange={(e) => setNewPlace({ ...newPlace, longitude: e.target.value })}
            />
          </div>
          <MediaUploadField
            label={t("places.form.photoLabel")}
            accept="image/jpeg,image/png,image/webp,image/gif,.gif"
            multiple={false}
            maxFiles={1}
            value={newPlace.imageUrl ? [newPlace.imageUrl] : []}
            onChange={(urls) => setNewPlace({ ...newPlace, imageUrl: urls[0] ?? "" })}
          />
          <AitButton
            className="w-full"
            variant="primary"
            disabled={!newPlace.name || createPlaceMutation.isPending}
            onClick={() => createPlaceMutation.mutate()}
          >
            {t("places.form.save")}
          </AitButton>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <AppLayout rightRail={<DiscoveryRightRail />}>
      <ReelsPageLayout
        header={
          <AitSectionHeader
            title={t("places.title")}
            description={t("places.description")}
            actions={createPlaceDialog}
          />
        }
        feed={
          <CatalogPageLayout
            search={
              <>
                <DestinationSearch
                  value={search}
                  onChange={setSearch}
                  onNavigate={(href) => {
                    if (href.startsWith("/place/")) {
                      navigate(href);
                      return;
                    }
                    if (href.startsWith("/map")) {
                      navigate(href);
                      return;
                    }
                    const params = new URLSearchParams(href.split("?")[1] ?? "");
                    applySearch(params.get("search") ?? search);
                  }}
                  placeType={typeFilter || undefined}
                  placeholder={t("places.searchPlaceholder")}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t("places.searchHint")}{" "}
                  <code className="text-ait-purple">npm run geo:import</code>
                </p>
              </>
            }
            filters={
              <CatalogFilterPanel
                onClear={clearFilters}
                showClear={Boolean(hasActiveFilters)}
                rows={[
                  {
                    label: t("places.filterType"),
                    options: filters.placeType,
                    value: typeFilter,
                    onChange: setTypeFilter,
                    icon: MapPin,
                  },
                  {
                    label: t("places.filterRating"),
                    options: filters.placeRating,
                    value: minRating,
                    onChange: setMinRating,
                    icon: Star,
                  },
                  {
                    label: t("places.filterPrice"),
                    options: filters.placePrice,
                    value: priceRange,
                    onChange: setPriceRange,
                    icon: DollarSign,
                  },
                ]}
              />
            }
            stats={<StatPill value={String(places.length)} label={t("places.statsInCatalog")} />}
          >
            {isLoading ? (
              <div
                className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
                aria-busy="true"
                aria-label={t("places.loading")}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <PlaceCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                variant="glass"
                icon={AlertCircle}
                title={t("places.loadError")}
                description={error instanceof Error ? error.message : t("social.errors.connection")}
                action={
                  <AitButton variant="glass" size="sm" onClick={() => refetch()}>
                    {t("common.retry")}
                  </AitButton>
                }
              />
            ) : places.length === 0 ? (
              <EmptyState
                variant="glass"
                icon={MapPin}
                title={t("places.notFound")}
                description={t("places.notFoundHint")}
                action={
                  hasActiveFilters ? (
                    <AitButton variant="glass" size="sm" onClick={clearFilters}>
                      {t("places.resetFilters")}
                    </AitButton>
                  ) : isAuthenticated ? (
                    <AitButton variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} aria-hidden />
                      {t("places.addPlace")}
                    </AitButton>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorite={isFavorite(place.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </CatalogPageLayout>
        }
      />
    </AppLayout>
  );
}

export default Places;
