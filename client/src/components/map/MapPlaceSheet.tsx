import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPinned, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";

export type MapSheetPlace = {
  id: string;
  name: string;
  type?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  averageRating?: string | null;
  priceRange?: string | null;
  address?: string | null;
};

type MapPlaceSheetProps = {
  place: MapSheetPlace | null;
  open: boolean;
  onClose: () => void;
};

export default function MapPlaceSheet({ place, open, onClose }: MapPlaceSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isCatalog = place != null && !place.id.startsWith("osm-") && !place.id.startsWith("trip-");
  const isTripMarker = place?.id.startsWith("trip-") ?? false;

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips/my-plannable"],
    enabled: open && !!place && !isTripMarker,
  });

  const addMutation = useMutation({
    mutationFn: async (tripId: string) => {
      if (!place) throw new Error("Место не выбрано");
      if (isCatalog) {
        const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints`, {
          placeId: place.id,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? "Не удалось добавить");
        }
        return tripId;
      }
      const lat = Number(place.latitude);
      const lon = Number(place.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error("Нет координат для этой точки");
      }
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints/from-location`, {
        label: place.name,
        lat,
        lon,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Не удалось добавить");
      }
      return tripId;
    },
    onSuccess: (tripId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "waypoints"] });
      toast({
        title: "Добавлено в поездку",
        description: `«${place?.name}» добавлено в маршрут.`,
      });
      onClose();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (!place) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="ait-glass border-white/10 rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-start justify-between gap-2">
            <span>{place.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {place.type && (
              <span className="text-xs capitalize bg-white/5 px-2 py-0.5 rounded-full">
                {place.type}
              </span>
            )}
            {place.averageRating && (
              <span className="text-xs flex items-center gap-1 text-ait-orange">
                <Star className="h-3 w-3 fill-current" />
                {place.averageRating}
              </span>
            )}
            {place.priceRange && (
              <span className="text-xs text-muted-foreground">{place.priceRange}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}

          <div className="flex flex-wrap gap-2">
            {isCatalog && (
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href={`/place/${place.id}`}>Подробнее</Link>
              </Button>
            )}
            {isTripMarker && (
              <Button variant="premium" className="rounded-xl" asChild>
                <Link href="/trips">Мои поездки</Link>
              </Button>
            )}
            {!isTripMarker && (
              <Button
                variant="premium"
                className="rounded-xl gap-2"
                disabled={addMutation.isPending}
                onClick={() => {
                  if (trips.length === 1) {
                    addMutation.mutate(trips[0]!.id);
                  }
                }}
              >
                <MapPinned className="h-4 w-4" />
                {trips.length === 1 ? "В поездку" : "Выберите поездку"}
              </Button>
            )}
          </div>

          {!isTripMarker && trips.length !== 1 && (
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Загрузка поездок…</p>
              ) : trips.length === 0 ? (
                <div className="text-center py-3 space-y-2">
                  <p className="text-sm text-muted-foreground">У вас пока нет поездок.</p>
                  <Button variant="premium" asChild className="rounded-xl">
                    <Link href="/trips">
                      <Plus className="h-4 w-4 mr-2" />
                      Создать поездку
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {trips.map((trip) => (
                    <li key={trip.id}>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto py-3 rounded-xl"
                        disabled={addMutation.isPending}
                        onClick={() => addMutation.mutate(trip.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{trip.title}</div>
                          <div className="text-xs text-muted-foreground">{trip.destination}</div>
                        </div>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
