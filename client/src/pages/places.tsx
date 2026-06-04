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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, MapPin, Filter, AlertCircle, Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePlaceFavorites } from "@/hooks/usePlaceFavorites";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Place } from "@shared/schema";
const PLACE_TYPES = [
  { value: "", label: "Все" },
  { value: "restaurant", label: "Рестораны" },
  { value: "hotel", label: "Отели" },
  { value: "attraction", label: "Достопримечательности" },
];

const PRICE_RANGES = [
  { value: "", label: "Любая" },
  { value: "$", label: "$" },
  { value: "$$", label: "$$" },
  { value: "$$$", label: "$$$" },
  { value: "$$$$", label: "$$$$" },
];

export function Places() {
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

  const { data: places = [], isLoading, isError, error, refetch } = useQuery<Place[]>({
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

  const handleSearch = () => {
    setActiveSearch(search.trim());
  };

  const createPlaceMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/places", {
        ...newPlace,
        latitude: newPlace.latitude || "0",
        longitude: newPlace.longitude || "0",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setCreateOpen(false);
      setNewPlace({ name: "", description: "", type: "attraction", latitude: "", longitude: "", address: "", priceRange: "$$" });
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
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Добавить место
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новое место</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Название" value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} />
                <Textarea placeholder="Описание" value={newPlace.description} onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })} />
                <select className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={newPlace.type} onChange={(e) => setNewPlace({ ...newPlace, type: e.target.value })}>
                  {PLACE_TYPES.filter((t) => t.value).map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <Input placeholder="Адрес" value={newPlace.address} onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Широта" value={newPlace.latitude} onChange={(e) => setNewPlace({ ...newPlace, latitude: e.target.value })} />
                  <Input placeholder="Долгота" value={newPlace.longitude} onChange={(e) => setNewPlace({ ...newPlace, longitude: e.target.value })} />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90" disabled={!newPlace.name || createPlaceMutation.isPending} onClick={() => createPlaceMutation.mutate()}>
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или описанию..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
          <Search className="mr-2 h-4 w-4" />
          Найти
        </Button>
      </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-muted-foreground flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            Тип:
          </span>
          {PLACE_TYPES.map((t) => (
            <Badge
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </Badge>
          ))}
          <span className="text-sm text-muted-foreground ml-2">Рейтинг от:</span>
          {["", "3", "4", "4.5"].map((r) => (
            <Badge
              key={r || "any"}
              variant={minRating === r ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setMinRating(r)}
            >
              {r || "Любой"}
            </Badge>
          ))}
          <span className="text-sm text-muted-foreground ml-2">Цена:</span>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="rounded-md px-2 py-1 text-sm ait-glass"
          >
            {PRICE_RANGES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Сбросить
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
