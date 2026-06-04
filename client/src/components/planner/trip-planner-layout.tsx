import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TravelMap from "@/components/maps/TravelMap";
import GlassCard from "@/components/brand/glass-card";
import GradientButton from "@/components/brand/gradient-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Download, Route } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { optimizeWaypointOrder, totalRouteKm } from "@/lib/routeUtils";
import type { Trip, Place } from "@shared/schema";
import type { TripWaypointWithPlace } from "@shared/schema";
import { differenceInCalendarDays } from "date-fns";

type TripPlannerLayoutProps = {
  trip: Trip;
  tripId: string;
  waypoints: TripWaypointWithPlace[];
  waypointsLoading: boolean;
  places: Place[];
  placeSearch: string;
  setPlaceSearch: (v: string) => void;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
};

export default function TripPlannerLayout({
  trip,
  tripId,
  waypoints,
  waypointsLoading,
  places,
  placeSearch,
  setPlaceSearch,
  addOpen,
  setAddOpen,
}: TripPlannerLayoutProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [budget, setBudget] = useState("2450");
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState("route");

  const routePlaces = useMemo(
    () =>
      waypoints
        .filter((w) => w.place)
        .map((w) => ({
          id: w.place!.id,
          name: w.place!.name,
          type: w.place!.type ?? undefined,
          latitude: w.place!.latitude,
          longitude: w.place!.longitude,
        })),
    [waypoints],
  );

  const coords = useMemo(
    () =>
      routePlaces.map(
        (p) => [Number(p.latitude), Number(p.longitude)] as [number, number],
      ),
    [routePlaces],
  );

  const days =
    trip.startDate && trip.endDate
      ? Math.max(
          1,
          differenceInCalendarDays(new Date(trip.endDate), new Date(trip.startDate)) + 1,
        )
      : 12;

  const kmStraight = totalRouteKm(coords);

  const { data: yandexRouteData } = useQuery<{
    configured: boolean;
    route: { distanceKm: number; durationMin: number; geometry: [number, number][] } | null;
  }>({
    queryKey: ["/api/trips", tripId, "yandex-route"],
    enabled: routePlaces.length >= 2,
  });

  const yandexRoute = yandexRouteData?.route ?? null;
  const km = yandexRoute?.distanceKm ?? kmStraight;

  const addWaypointMutation = useMutation({
    mutationFn: async (placeId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints`, { placeId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "waypoints"] });
      setAddOpen(false);
      setPlaceSearch("");
      toast({ title: "Остановка добавлена" });
    },
  });

  const removeWaypointMutation = useMutation({
    mutationFn: async (waypointId: string) => {
      await apiRequest("DELETE", `/api/trips/${tripId}/waypoints/${waypointId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "waypoints"] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "waypoints"] });
      toast({ title: "Маршрут оптимизирован" });
    },
    onError: () => {
      toast({ title: "Не удалось обновить порядок", variant: "destructive" });
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

  const handleExport = () => {
    const data = {
      trip: trip.title,
      destination: trip.destination,
      waypoints: waypoints.map((w, i) => ({
        order: i + 1,
        name: w.place?.name,
        address: w.place?.address,
      })),
      budget,
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
  const placeOptions = places.filter((p) => !existingPlaceIds.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <p className="text-muted-foreground text-sm">{trip.destination}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="ait-glass mb-4">
          <TabsTrigger value="route">Маршрут</TabsTrigger>
          <TabsTrigger value="budget">Бюджет</TabsTrigger>
          <TabsTrigger value="notes">Заметки</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
        </TabsList>
        <TabsContent value="route" className="mt-0">
          <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[480px]">
            <GlassCard className="p-4 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-12rem)]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4 text-ait-purple" />
                  Маршрут
                </span>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="premium">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="ait-glass-strong">
                    <DialogHeader>
                      <DialogTitle>Добавить остановку</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Поиск мест..."
                      value={placeSearch}
                      onChange={(e) => setPlaceSearch(e.target.value)}
                    />
                    <div className="max-h-64 overflow-auto space-y-2 mt-2">
                      {placeOptions.slice(0, 15).map((place) => (
                        <div
                          key={place.id}
                          className="flex justify-between p-2 rounded-lg border border-white/10"
                        >
                          <span className="text-sm font-medium">{place.name}</span>
                          <Button
                            size="sm"
                            variant="premium"
                            onClick={() => addWaypointMutation.mutate(place.id)}
                          >
                            +
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {waypointsLoading ? (
                <div className="h-32 animate-pulse bg-white/5 rounded" />
              ) : waypoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">Добавьте остановки в маршрут</p>
              ) : (
                <ul className="space-y-3">
                  {waypoints.map((w, index) => (
                    <li key={w.id} className="flex gap-3 p-2 rounded-xl border border-white/8 bg-white/3">
                      <div
                        className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 bg-muted"
                        style={{
                          backgroundImage: w.place?.imageUrl
                            ? `url('${w.place.imageUrl}')`
                            : "linear-gradient(135deg,#8b5cf6,#ec4899)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-ait-purple font-medium">День {index + 1}</div>
                        {w.place ? (
                          <Link href={`/place/${w.place.id}`}>
                            <span className="font-medium text-sm hover:underline">{w.place.name}</span>
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWaypointMutation.mutate(w.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
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
          <GlassCard className="p-6 max-w-md">
            <label className="text-sm text-muted-foreground">Бюджет поездки (USD)</label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-2"
            />
          </GlassCard>
        </TabsContent>

        <TabsContent value="notes">
          <GlassCard className="p-6">
            <Textarea
              placeholder="Заметки к поездке..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
            />
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
            <strong>{days}</strong> дней
          </span>
          <span>
            <strong>{routePlaces.length}</strong> локаций
          </span>
          <span>
            <strong>{km || "—"}</strong> км
            {yandexRoute ? " (Яндекс)" : ""}
          </span>
          {yandexRoute?.durationMin != null && (
            <span>
              <strong>{yandexRoute.durationMin}</strong> мин в пути
            </span>
          )}
          <span>
            <strong>${budget}</strong> бюджет
          </span>
        </div>
        <GradientButton onClick={handleOptimize} disabled={routePlaces.length < 2 || reorderMutation.isPending}>
          {reorderMutation.isPending ? "Оптимизация…" : "Оптимизировать маршрут (AI)"}
        </GradientButton>
      </div>
    </div>
  );
}
