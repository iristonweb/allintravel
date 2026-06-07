import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import PlaceCard from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, AlertCircle, Plus } from "lucide-react";
import { useLocation } from "wouter";
import DestinationSearch from "@/components/search/DestinationSearch";
import FilterChipRow from "@/components/filters/FilterChipRow";
import { PLACE_TYPE_FILTERS, PLACE_RATING_FILTERS, PLACE_PRICE_FILTERS } from "@/lib/filter-config";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePlaceFavorites } from "@/hooks/usePlaceFavorites";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MediaUploadField from "@/components/media/MediaUploadField";
import type { Place } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function Places() {
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
        limit: 50,
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
      toast({ title: "Место добавлено" });
    },
    onError: () => {
      toast({ title: "Не удалось добавить место", variant: "destructive" });
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

  return (
    <AppLayout>
      <PageHeader
        title="Места"
        description="Рестораны, отели и достопримечательности, которые рекомендуют путешественники"
        rightSlot={
          isAuthenticated ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="premium">
                <Plus className="mr-2 h-4 w-4" />
                Добавить место
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новое место</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Название"
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                />
                <Textarea
                  placeholder="Описание"
                  value={newPlace.description}
                  onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                />
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={newPlace.type}
                  onChange={(e) => setNewPlace({ ...newPlace, type: e.target.value })}
                >
                  {PLACE_TYPE_FILTERS.filter((t) => t.value).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Адрес"
                  value={newPlace.address}
                  onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Широта"
                    value={newPlace.latitude}
                    onChange={(e) => setNewPlace({ ...newPlace, latitude: e.target.value })}
                  />
                  <Input
                    placeholder="Долгота"
                    value={newPlace.longitude}
                    onChange={(e) => setNewPlace({ ...newPlace, longitude: e.target.value })}
                  />
                </div>
                <MediaUploadField
                  label="Фото места"
                  accept="image/jpeg,image/png,image/webp,image/gif,.gif"
                  multiple={false}
                  maxFiles={1}
                  value={newPlace.imageUrl ? [newPlace.imageUrl] : []}
                  onChange={(urls) => setNewPlace({ ...newPlace, imageUrl: urls[0] ?? "" })}
                />
                <Button
                  className="w-full"
                  variant="premium"
                  disabled={!newPlace.name || createPlaceMutation.isPending}
                  onClick={() => createPlaceMutation.mutate()}
                >
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          ) : null
        }
      />

      <div className="mb-6 mt-8 max-w-2xl">
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
          placeholder="Город, страна или название места…"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Подсказки: база GeoNames (страны и города) + каталог мест. Для полной базы выполните{" "}
          <code className="text-ait-purple">npm run geo:import</code>
        </p>
      </div>

      <div className="ait-glass-strong rounded-2xl border border-white/10 p-4 mb-6 space-y-4">
        <FilterChipRow
          label="Тип"
          options={PLACE_TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FilterChipRow
          label="Рейтинг"
          options={PLACE_RATING_FILTERS}
          value={minRating}
          onChange={setMinRating}
        />
        <FilterChipRow
          label="Цена"
          options={PLACE_PRICE_FILTERS}
          value={priceRange}
          onChange={setPriceRange}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
            Сбросить все фильтры
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">{places.length} мест</p>
              <p className="text-sm text-muted-foreground">в каталоге</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-80 animate-pulse bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Не удалось загрузить места"
          description={error instanceof Error ? error.message : "Ошибка соединения с сервером."}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        />
      ) : places.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Места не найдены"
          description="Попробуйте изменить фильтры или поисковый запрос"
          action={
            <Button variant="outline" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </AppLayout>
  );
}

export default Places;
