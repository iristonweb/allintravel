import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPinned, Plus, Star, X } from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      if (!place) throw new Error(t("map.placeSheet.noPlace"));
      if (isCatalog) {
        const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints`, {
          placeId: place.id,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? t("map.placeSheet.addFailed"));
        }
        return tripId;
      }
      const lat = Number(place.latitude);
      const lon = Number(place.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error(t("map.placeSheet.noCoords"));
      }
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints/from-location`, {
        label: place.name,
        lat,
        lon,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? t("map.placeSheet.addFailed"));
      }
      return tripId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: t("map.placeSheet.addedTitle"),
        description: t("map.placeSheet.addedDesc", { name: place?.name ?? "" }),
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
            <AitButton
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </AitButton>
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
              <AitButton variant="secondary" className="rounded-xl" asChild>
                <Link href={`/place/${place.id}`}>{t("map.placeSheet.details")}</Link>
              </AitButton>
            )}
            {isTripMarker && (
              <AitButton variant="primary" className="rounded-xl" asChild>
                <Link href="/trips">{t("map.placeSheet.myTrips")}</Link>
              </AitButton>
            )}
            {!isTripMarker && (
              <AitButton
                variant="primary"
                className="rounded-xl gap-2"
                disabled={addMutation.isPending}
                onClick={() => {
                  if (trips.length === 1) {
                    addMutation.mutate(trips[0]!.id);
                  }
                }}
              >
                <MapPinned className="h-4 w-4" />
                {trips.length === 1 ? t("map.placeSheet.addToTrip") : t("map.placeSheet.pickTrip")}
              </AitButton>
            )}
          </div>

          {!isTripMarker && trips.length !== 1 && (
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">{t("map.placeSheet.loadingTrips")}</p>
              ) : trips.length === 0 ? (
                <div className="text-center py-3 space-y-2">
                  <p className="text-sm text-muted-foreground">{t("map.placeSheet.noTrips")}</p>
                  <AitButton variant="primary" asChild className="rounded-xl">
                    <Link href="/trips">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("map.placeSheet.createTrip")}
                    </Link>
                  </AitButton>
                </div>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {trips.map((trip) => (
                    <li key={trip.id}>
                      <AitButton
                        type="button"
                        variant="secondary"
                        className="w-full justify-start h-auto py-3 rounded-xl"
                        disabled={addMutation.isPending}
                        onClick={() => addMutation.mutate(trip.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{trip.title}</div>
                          <div className="text-xs text-muted-foreground">{trip.destination}</div>
                        </div>
                      </AitButton>
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
