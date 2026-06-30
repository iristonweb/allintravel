import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";

type AddPlaceToTripButtonProps = {
  placeId: string;
  placeName: string;
};

export default function AddPlaceToTripButton({ placeId, placeName }: AddPlaceToTripButtonProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips/my-plannable"],
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/waypoints`, { placeId });
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
        description: `«${placeName}» добавлено в маршрут.`,
      });
      setOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="premium" className="gap-2 rounded-2xl">
          <MapPinned className="h-4 w-4" />В поездку
        </Button>
      </DialogTrigger>
      <DialogContent className="ait-glass border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить в поездку</DialogTitle>
          <DialogDescription>Выберите поездку, куда добавить «{placeName}».</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка поездок…</p>
        ) : trips.length === 0 ? (
          <div className="space-y-3 text-center py-4">
            <p className="text-sm text-muted-foreground">У вас пока нет поездок.</p>
            <Button variant="premium" asChild>
              <Link href="/trips">
                <Plus className="h-4 w-4 mr-2" />
                Создать поездку
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  );
}
