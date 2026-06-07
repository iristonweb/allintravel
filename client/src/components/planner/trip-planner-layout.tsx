import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TravelMap from "@/components/maps/TravelMap";
import GlassCard from "@/components/brand/glass-card";
import GradientButton from "@/components/brand/gradient-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddStopSearch from "@/components/planner/add-stop-search";
import type { GeoAutocompleteItem } from "@/components/location-autocomplete-input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Download,
  Route,
  Calendar,
  Users,
  BookOpen,
  GripVertical,
  Film,
  MapPin,
  Share2,
  Car,
  Footprints,
  Bus,
} from "lucide-react";
import TripCinema from "@/components/trips/TripCinema";
import { apiRequest, apiRequestJson, toApiUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { optimizeWaypointOrder, totalRouteKm } from "@/lib/routeUtils";
import {
  dayLabel,
  distributeStopsAcrossDays,
  groupWaypointsByDay,
  tripCalendarDayCount,
} from "@/lib/trip-days";
import type { Trip } from "@shared/schema";
import type { TripWaypointWithPlace } from "@shared/schema";
import { cn } from "@/lib/utils";
import type { RouteMode } from "@/lib/fetch-route";

const ROUTE_MODES: { id: RouteMode; label: string; icon: typeof Car }[] = [
  { id: "driving", label: "Авто", icon: Car },
  { id: "walking", label: "Пешком", icon: Footprints },
  { id: "transit", label: "Транспорт", icon: Bus },
];

type TripPlannerLayoutProps = {
  trip: Trip;
  tripId: string;
  waypoints: TripWaypointWithPlace[];
  waypointsLoading: boolean;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
};

export default function TripPlannerLayout({
  trip,
  tripId,
  waypoints,
  waypointsLoading,
  addOpen,
  setAddOpen,
}: TripPlannerLayoutProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [budgetMax, setBudgetMax] = useState("");
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState("route");
  const [selectedDay, setSelectedDay] = useState(1);
  const [dragWaypointId, setDragWaypointId] = useState<string | null>(null);
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>("walking");

  const totalDays = tripCalendarDayCount(trip);

  useEffect(() => {
    setBudgetMax(
      trip.budgetMax != null
        ? String(trip.budgetMax)
        : trip.budgetMin != null
          ? String(trip.budgetMin)
          : "",
    );
    setNotes(trip.plannerNotes ?? "");
  }, [trip.id, trip.budgetMax, trip.budgetMin, trip.plannerNotes]);

  const waypointsByDay = useMemo(
    () => groupWaypointsByDay(waypoints, totalDays),
    [waypoints, totalDays],
  );

  const routePlaces = useMemo(() => {
    const dayStops = waypointsByDay.get(selectedDay) ?? [];
    const source = dayStops.length > 0 ? dayStops : waypoints;
    return source
      .filter((w) => w.place)
      .map((w) => ({
        id: w.place!.id,
        name: w.place!.name,
        type: w.place!.type ?? undefined,
        latitude: w.place!.latitude,
        longitude: w.place!.longitude,
      }));
  }, [waypoints, waypointsByDay, selectedDay]);

  const allRoutePlacesCount = useMemo(() => waypoints.filter((w) => w.place).length, [waypoints]);

  const routeScopeHasDay = (waypointsByDay.get(selectedDay) ?? []).some((w) => w.place);
  const yandexRouteDayKey = routeScopeHasDay ? selectedDay : "all";

  const routeCoords = useMemo(
    () => routePlaces.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]),
    [routePlaces],
  );

  const kmStraight = totalRouteKm(routeCoords);

  const { data: yandexRouteData } = useQuery<{
    configured: boolean;
    route: { distanceKm: number; durationMin: number; geometry: [number, number][] } | null;
  }>({
    queryKey: ["/api/trips", tripId, "yandex-route", yandexRouteDayKey, routeMode],
    enabled: routePlaces.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({ mode: routeMode });
      if (routeScopeHasDay) params.set("day", String(selectedDay));
      const res = await fetch(toApiUrl(`/api/trips/${tripId}/yandex-route?${params}`), {
        credentials: "include",
      });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
  });

  const { data: chatRoomData } = useQuery<{ room: { slug: string; title: string }; slug: string }>({
    queryKey: ["/api/trips", tripId, "chat-room"],
    enabled: tab === "group",
  });

  const { data: routeMatchesData } = useQuery<{
    matches: { tripId: string; title: string; destination: string; overlapPercent: number }[];
  }>({
    queryKey: ["/api/trips", tripId, "route-matches"],
    enabled: tab === "matches",
  });

  const yandexRoute = yandexRouteData?.route ?? null;
  const km = yandexRoute?.distanceKm ?? kmStraight;

  const invalidateRouteQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "waypoints"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "yandex-route"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
  };

  const saveTripMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiRequest("PUT", `/api/trips/${tripId}`, patch);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
    },
  });

  const persistPlannerFields = useCallback(() => {
    const max = budgetMax.trim() ? Number(budgetMax) : null;
    saveTripMutation.mutate({
      budgetMax: max != null && Number.isFinite(max) ? max : null,
      budgetMin: max != null && Number.isFinite(max) ? max : null,
      plannerNotes: notes.trim() || null,
    });
  }, [budgetMax, notes, saveTripMutation]);

  const addWaypointMutation = useMutation({
    mutationFn: async (placeId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints`, {
        placeId,
        dayNumber: selectedDay,
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateRouteQueries();
      setAddOpen(false);
      toast({ title: "Остановка добавлена" });
    },
  });

  const addFromLocationMutation = useMutation({
    mutationFn: async (item: GeoAutocompleteItem) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints/from-location`, {
        label: item.label,
        lat: Number(item.lat),
        lon: Number(item.lon),
        dayNumber: selectedDay,
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateRouteQueries();
      setAddOpen(false);
      toast({ title: "Остановка добавлена" });
    },
    onError: () => {
      toast({ title: "Не удалось добавить остановку", variant: "destructive" });
    },
  });

  const removeWaypointMutation = useMutation({
    mutationFn: async (waypointId: string) => {
      await apiRequest("DELETE", `/api/trips/${tripId}/waypoints/${waypointId}`);
    },
    onSuccess: invalidateRouteQueries,
  });

  const patchWaypointMutation = useMutation({
    mutationFn: async ({
      waypointId,
      dayNumber,
      orderIndex,
    }: {
      waypointId: string;
      dayNumber?: number;
      orderIndex?: number;
    }) => {
      const res = await apiRequest("PATCH", `/api/trips/${tripId}/waypoints/${waypointId}`, {
        dayNumber,
        orderIndex,
      });
      return res.json();
    },
    onSuccess: invalidateRouteQueries,
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await apiRequest("PATCH", `/api/trips/${tripId}/waypoints/${orderedIds[i]}`, {
          orderIndex: i,
        });
      }
    },
    onSuccess: () => {
      invalidateRouteQueries();
      toast({ title: "Порядок остановок обновлён" });
    },
    onError: () => {
      toast({ title: "Не удалось обновить порядок", variant: "destructive" });
    },
  });

  const distributeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints/distribute-days`, {});
      return res.json();
    },
    onSuccess: () => {
      invalidateRouteQueries();
      toast({ title: "Остановки распределены по дням" });
    },
    onError: () => {
      toast({ title: "Не удалось распределить", variant: "destructive" });
    },
  });

  const publishJournalMutation = useMutation({
    mutationFn: async (day: number | null) => {
      const q = day != null ? `?day=${day}` : "";
      const tplRes = await apiRequest("GET", `/api/trips/${tripId}/journal-template${q}`);
      const tpl = await tplRes.json();
      const res = await apiRequest("POST", "/api/posts", {
        format: "journal",
        title: tpl.title,
        content: tpl.content,
        tripId: tpl.tripId,
        location: tpl.location,
        isPublic: true,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Журнал опубликован",
        description: "Запись появилась в ленте сообщества",
      });
    },
    onError: () => {
      toast({ title: "Не удалось опубликовать", variant: "destructive" });
    },
  });

  const handleOptimize = () => {
    const withCoords = waypoints
      .filter((w) => w.place?.latitude != null && w.place?.longitude != null)
      .map((w) => ({
        waypointId: w.id,
        placeId: w.placeId,
        lat: Number(w.place!.latitude),
        lng: Number(w.place!.longitude),
      }));
    const optimized = optimizeWaypointOrder(withCoords);
    reorderMutation.mutate(optimized.map((x) => x.waypointId));
  };

  const handleDistributeLocal = () => {
    const plan = distributeStopsAcrossDays(waypoints, totalDays);
    Promise.all(
      plan.map((p) =>
        apiRequest("PATCH", `/api/trips/${tripId}/waypoints/${p.waypointId}`, {
          dayNumber: p.dayNumber,
          orderIndex: p.orderIndex,
        }),
      ),
    )
      .then(() => {
        invalidateRouteQueries();
        toast({ title: "Остановки распределены по дням" });
      })
      .catch(() => {
        distributeMutation.mutate();
      });
  };

  const handleDropOnDay = (day: number) => {
    if (!dragWaypointId) return;
    patchWaypointMutation.mutate({ waypointId: dragWaypointId, dayNumber: day });
    setDragWaypointId(null);
  };

  const handleExport = () => {
    const data = {
      trip: trip.title,
      destination: trip.destination,
      days: totalDays,
      waypoints: waypoints.map((w) => ({
        order: w.orderIndex,
        day: w.dayNumber,
        name: w.place?.name,
        address: w.place?.address,
      })),
      budgetMax: budgetMax || trip.budgetMax,
      notes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.title}-route.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const existingPlaceIds = new Set(waypoints.map((w) => w.placeId));
  const addingStop = addWaypointMutation.isPending || addFromLocationMutation.isPending;
  const chatHref = chatRoomData?.slug
    ? `/chat?room=${encodeURIComponent(chatRoomData.slug)}&from=${encodeURIComponent(`/trips/${tripId}`)}`
    : "/chat";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <p className="text-muted-foreground text-sm">{trip.destination}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-2xl"
            onClick={() => {
              const url = `${window.location.origin}/trips/${tripId}`;
              void navigator.clipboard.writeText(url);
              toast({ title: "Ссылка на поездку скопирована" });
            }}
          >
            <Share2 className="h-4 w-4" />
            Поделиться
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-2xl"
            onClick={() => {
              void apiRequestJson("POST", `/api/trips/${tripId}/checkin`)
                .then((r) => {
                  if ((r as { alreadyCheckedIn?: boolean }).alreadyCheckedIn) {
                    toast({ title: "Check-in уже был сегодня" });
                  }
                })
                .catch((e: Error) => toast({ title: e.message, variant: "destructive" }));
            }}
          >
            <MapPin className="h-4 w-4" />
            Check-in
          </Button>
          <Button
            type="button"
            variant="premium"
            className="gap-2 rounded-2xl"
            onClick={() => setCinemaOpen(true)}
            disabled={waypoints.filter((w) => w.place).length < 2}
          >
            <Film className="h-4 w-4" />
            Trip Cinema
          </Button>
        </div>
      </div>

      {cinemaOpen && (
        <TripCinema
          trip={trip}
          tripId={tripId}
          waypoints={waypoints}
          onClose={() => setCinemaOpen(false)}
        />
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="ait-glass mb-4 flex-wrap h-auto">
          <TabsTrigger value="route">Маршрут</TabsTrigger>
          <TabsTrigger value="budget">Бюджет</TabsTrigger>
          <TabsTrigger value="notes">Заметки</TabsTrigger>
          <TabsTrigger value="group">Группа</TabsTrigger>
          <TabsTrigger value="matches">Совпадения</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="mt-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-colors",
                  selectedDay === d
                    ? "border-ait-purple/60 bg-ait-purple/15 text-white"
                    : "border-white/10 text-muted-foreground hover:border-ait-purple/30",
                )}
              >
                {dayLabel(trip, d)}
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDistributeLocal}
              disabled={waypoints.length === 0 || distributeMutation.isPending}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Разложить по датам
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {ROUTE_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRouteMode(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors",
                  routeMode === id
                    ? "border-ait-purple/60 bg-ait-purple/15 text-white"
                    : "border-white/10 text-muted-foreground hover:border-ait-purple/30",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[480px]">
            <GlassCard className="p-4 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-12rem)]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4 text-ait-purple" />
                  {dayLabel(trip, selectedDay)}
                </span>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="premium">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="ait-glass-strong sm:max-w-lg max-h-[85vh] overflow-y-auto"
                    onInteractOutside={(e) => {
                      if ((e.target as HTMLElement).closest("[data-geo-autocomplete]")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Добавить остановку</DialogTitle>
                    </DialogHeader>
                    <AddStopSearch
                      key={addOpen ? "open" : "closed"}
                      existingPlaceIds={existingPlaceIds}
                      adding={addingStop}
                      onAddPlace={(placeId) => addWaypointMutation.mutate(placeId)}
                      onAddLocation={(item) => addFromLocationMutation.mutateAsync(item)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {waypointsLoading ? (
                <div className="h-32 animate-pulse bg-white/5 rounded" />
              ) : waypoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">Добавьте остановки в маршрут</p>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                    const dayStops = waypointsByDay.get(day) ?? [];
                    return (
                      <div
                        key={day}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropOnDay(day)}
                        className={cn(
                          "rounded-xl border border-dashed p-2 min-h-[48px]",
                          selectedDay === day
                            ? "border-ait-purple/40 bg-ait-purple/5"
                            : "border-white/10",
                        )}
                      >
                        <div className="text-xs font-medium text-ait-orange mb-2">
                          {dayLabel(trip, day)}
                        </div>
                        {dayStops.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-1">
                            Перетащите остановку сюда
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {dayStops.map((w) => (
                              <li
                                key={w.id}
                                draggable
                                onDragStart={() => setDragWaypointId(w.id)}
                                onDragEnd={() => setDragWaypointId(null)}
                                className="flex gap-2 p-2 rounded-lg border border-white/8 bg-white/3 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                                <div
                                  className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 bg-muted"
                                  style={{
                                    backgroundImage: w.place?.imageUrl
                                      ? `url('${w.place.imageUrl}')`
                                      : "linear-gradient(135deg,#8b5cf6,#ec4899)",
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  {w.place ? (
                                    <Link href={`/place/${w.place.id}`}>
                                      <span className="font-medium text-sm hover:underline">
                                        {w.place.name}
                                      </span>
                                    </Link>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  aria-label="Удалить точку маршрута"
                                  onClick={() => removeWaypointMutation.mutate(w.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => publishJournalMutation.mutate(selectedDay)}
                  disabled={publishJournalMutation.isPending || waypoints.length === 0}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Опубликовать день в журнал
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => publishJournalMutation.mutate(null)}
                  disabled={publishJournalMutation.isPending || waypoints.length === 0}
                >
                  Опубликовать всю поездку
                </Button>
              </div>
            </GlassCard>

            <GlassCard strong className="p-0 overflow-hidden min-h-[420px] ait-gradient-border">
              {routePlaces.length > 0 ? (
                <TravelMap
                  places={routePlaces}
                  showRoute
                  routeGeometry={yandexRoute?.geometry}
                  height="100%"
                  className="h-full min-h-[420px] rounded-[24px]"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                  Карта маршрута появится после добавления мест
                </div>
              )}
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <GlassCard className="p-6 max-w-md space-y-4">
            <label className="text-sm text-muted-foreground">Бюджет поездки (USD)</label>
            <Input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              onBlur={persistPlannerFields}
              className="mt-2"
            />
            <Button
              variant="premium"
              onClick={persistPlannerFields}
              disabled={saveTripMutation.isPending}
            >
              Сохранить
            </Button>
          </GlassCard>
        </TabsContent>

        <TabsContent value="notes">
          <GlassCard className="p-6 space-y-4">
            <Textarea
              placeholder="Заметки к поездке..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={persistPlannerFields}
              rows={8}
            />
            <Button
              variant="premium"
              onClick={persistPlannerFields}
              disabled={saveTripMutation.isPending}
            >
              Сохранить заметки
            </Button>
          </GlassCard>
        </TabsContent>

        <TabsContent value="group">
          <GlassCard className="p-6 max-w-lg space-y-4">
            <div className="flex items-center gap-2 text-ait-purple">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Чат группы</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              При создании поездки автоматически открывается приватный чат группы. Участников можно
              было пригласить через @ник; новые попутчики из каталога тоже попадают в чат при
              присоединении.
            </p>
            <Link href={chatHref}>
              <Button variant="premium">Открыть чат поездки</Button>
            </Link>
          </GlassCard>
        </TabsContent>

        <TabsContent value="matches">
          <GlassCard className="p-6 space-y-3">
            <h3 className="font-semibold">Похожие маршруты</h3>
            <p className="text-sm text-muted-foreground">
              Поездки с пересечением остановок (в радиусе ~35 км) — потенциальные попутчики.
            </p>
            {(routeMatchesData?.matches ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Добавьте минимум 2 остановки для поиска совпадений.
              </p>
            ) : (
              <ul className="space-y-2">
                {routeMatchesData!.matches.map((m) => (
                  <li
                    key={m.tripId}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/10"
                  >
                    <div>
                      <Link href={`/trips/${m.tripId}`} className="font-medium hover:underline">
                        {m.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{m.destination}</p>
                    </div>
                    <span className="text-sm font-semibold text-ait-purple">
                      {m.overlapPercent}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="export">
          <GlassCard className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Скачайте маршрут в JSON для офлайн-использования.
            </p>
            <Button variant="premium" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт маршрута
            </Button>
          </GlassCard>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-20 md:bottom-4 z-30 ait-glass-strong rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <strong>{totalDays}</strong> дней
          </span>
          <span>
            <strong>{allRoutePlacesCount}</strong> локаций
          </span>
          <span>
            <strong>{km || "—"}</strong> км
            {yandexRoute
              ? ` (${ROUTE_MODES.find((m) => m.id === routeMode)?.label ?? "маршрут"})`
              : ""}
          </span>
          {yandexRoute?.durationMin != null && (
            <span>
              <strong>{yandexRoute.durationMin}</strong> мин в пути
            </span>
          )}
          <span>
            <strong>${budgetMax || "—"}</strong> бюджет
          </span>
        </div>
        <GradientButton
          onClick={handleOptimize}
          disabled={allRoutePlacesCount < 2 || reorderMutation.isPending}
        >
          {reorderMutation.isPending ? "Оптимизация…" : "Оптимизировать порядок"}
        </GradientButton>
      </div>
    </div>
  );
}
