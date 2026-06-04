import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Users, ArrowLeft, Plus, Trash2, Route } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip, Place } from "@shared/schema";
import type { TripWaypointWithPlace } from "@shared/schema";
import { useState, useMemo } from "react";
import PlaceMap from "@/components/PlaceMap";

export function TripDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [placeSearch, setPlaceSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: trip, isLoading: tripLoading } = useQuery<Trip>({
    queryKey: ["/api/trips", id],
    enabled: !!id,
  });

  const { data: waypoints = [], isLoading: waypointsLoading } = useQuery<TripWaypointWithPlace[]>({
    queryKey: ["/api/trips", id, "waypoints"],
    enabled: !!id,
  });

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 20, ...(placeSearch && { search: placeSearch }) }],
    enabled: addOpen,
  });

  const addWaypointMutation = useMutation({
    mutationFn: async (placeId: string) => {
      const res = await apiRequest("POST", `/api/trips/${id}/waypoints`, { placeId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "waypoints"] });
      setAddOpen(false);
      setPlaceSearch("");
      toast({ title: "Остановка добавлена в маршрут" });
    },
    onError: () => {
      toast({ title: "Ошибка добавления", variant: "destructive" });
    },
  });

  const removeWaypointMutation = useMutation({
    mutationFn: async (waypointId: string) => {
      await apiRequest("DELETE", `/api/trips/${id}/waypoints/${waypointId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "waypoints"] });
      toast({ title: "Остановка удалена" });
    },
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return format(new Date(date), "d MMM yyyy", { locale: ru });
  };

  const routePlaces = useMemo(
    () =>
      waypoints
        .filter((w) => w.place)
        .map((w) => ({
          id: w.place!.id,
          name: w.place!.name,
          type: w.place!.type,
          latitude: w.place!.latitude,
          longitude: w.place!.longitude,
        })),
    [waypoints],
  );

  if (!id) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Поездка не указана</p>
        <Link href="/trips">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К поездкам
          </Button>
        </Link>
      </AppLayout>
    );
  }

  if (tripLoading || !trip) {
    return (
      <AppLayout>
        <div className="h-64 animate-pulse bg-muted rounded-lg" />
      </AppLayout>
    );
  }

  const existingPlaceIds = new Set(waypoints.map((w) => w.placeId));
  const placeOptions = places.filter((p) => !existingPlaceIds.has(p.id));

  return (
    <AppLayout>
      <Link href="/trips">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку поездок
        </Button>
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{trip.title}</CardTitle>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {trip.currentParticipants ?? 1} / {trip.maxParticipants ?? 5} участников
            </span>
          </div>
          {trip.description && <p className="text-muted-foreground mt-2">{trip.description}</p>}
        </CardHeader>
      </Card>

      {routePlaces.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Карта маршрута</CardTitle>
          </CardHeader>
          <CardContent>
            <PlaceMap places={routePlaces} showRoute height="20rem" zoom={6} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Маршрут (остановки)
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Добавить остановку
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить место в маршрут</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Поиск мест..."
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                />
                <div className="max-h-64 overflow-auto space-y-2">
                  {placeOptions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Найдите место по названию или выберите из списка</p>
                  )}
                  {placeOptions.slice(0, 15).map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{place.name}</p>
                        <p className="text-xs text-muted-foreground">{place.type}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addWaypointMutation.mutate(place.id)}
                        disabled={addWaypointMutation.isPending}
                      >
                        Добавить
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {waypointsLoading ? (
            <div className="h-24 animate-pulse bg-muted rounded" />
          ) : waypoints.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">
              Остановок пока нет. Добавьте места из каталога, чтобы построить маршрут.
            </p>
          ) : (
            <ul className="space-y-3">
              {waypoints.map((w, index) => (
                <li key={w.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                  <span className="text-muted-foreground font-mono w-6">{index + 1}.</span>
                  {w.place ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <Link href={`/place/${w.place.id}`}>
                          <span className="font-medium hover:underline">{w.place.name}</span>
                        </Link>
                        {w.place.address && (
                          <p className="text-sm text-muted-foreground truncate">{w.place.address}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWaypointMutation.mutate(w.id)}
                        disabled={removeWaypointMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Место удалено</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

export default TripDetail;
