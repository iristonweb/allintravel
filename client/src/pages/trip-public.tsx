import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/app-layout";
import PublicLayout from "@/components/public-layout";
import GlassCard from "@/components/brand/glass-card";
import TravelMap from "@/components/maps/TravelMap";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip, TripWaypointWithPlace } from "@shared/schema";
import TripMarketplaceActions from "@/components/trips/TripMarketplaceActions";
import { useTranslation } from "react-i18next";
import { MapPin, Copy, LogIn } from "lucide-react";

type PublicTripPayload = {
  trip: Trip;
  waypoints: TripWaypointWithPlace[];
  stopCount: number;
};

function TripPublicContent({ guest }: { guest: boolean }) {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<PublicTripPayload>({
    queryKey: ["/api/trips", id, "public"],
    queryFn: () => apiRequestJson("GET", `/api/trips/${id}/public`),
    enabled: !!id,
  });

  useDocumentMeta(
    data
      ? {
          title: `${data.trip.title} — маршрут | All In Travel`,
          description: `${data.stopCount} остановок · ${data.trip.destination}`,
          image: data.trip.imageUrl ?? `${window.location.origin}/brand/logo-ait.png`,
          url: `${window.location.origin}/trips/${id}/public`,
        }
      : null,
  );

  const copyMutation = useMutation({
    mutationFn: () => apiRequestJson<Trip>("POST", `/api/trips/${id}/copy`),
    onSuccess: (trip) => {
      toast({ title: "Маршрут скопирован" });
      window.location.href = `/trips/${trip.id}`;
    },
    onError: () => toast({ title: "Войдите, чтобы скопировать маршрут", variant: "destructive" }),
  });

  const Layout = guest ? PublicLayout : AppLayout;

  if (isLoading) {
    return (
      <Layout>
        <div className="h-64 animate-pulse bg-muted rounded-2xl" />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <p className="text-muted-foreground">Маршрут не найден или скрыт.</p>
      </Layout>
    );
  }

  const mapPlaces = data.waypoints
    .filter((w) => w.place)
    .map((w) => ({
      id: w.place!.id,
      name: w.place!.name,
      type: w.place!.type ?? undefined,
      latitude: w.place!.latitude,
      longitude: w.place!.longitude,
    }));

  return (
    <Layout contentClassName="py-8">
      <GlassCard className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{data.trip.title}</h1>
          <p className="text-muted-foreground">{data.trip.destination}</p>
          <p className="text-sm text-muted-foreground mt-1">{data.stopCount} остановок</p>
        </div>

        {mapPlaces.length > 0 && (
          <TravelMap places={mapPlaces} height="18rem" className="rounded-xl overflow-hidden" />
        )}

        <ol className="space-y-2">
          {data.waypoints.map((w, i) => (
            <li key={w.id} className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-6">{i + 1}.</span>
              <span>
                <MapPin className="inline h-3 w-3 mr-1 text-primary" />
                {w.place?.name ?? "Остановка"}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2 pt-2 items-center">
          <TripMarketplaceActions
            tripId={data.trip.id}
            isOwner={user?.id === data.trip.userId}
            isPublic
            priceCents={data.trip.priceCents}
            isForSale={data.trip.isForSale}
          />
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="gap-2"
              disabled={copyMutation.isPending}
              onClick={() => copyMutation.mutate()}
            >
              <Copy className="h-4 w-4" />
              {t("marketplace.fork")}
            </Button>
          ) : (
            <Button variant="premium" className="gap-2" asChild>
              <Link href={`/login?redirect=${encodeURIComponent(`/trips/${id}/public`)}`}>
                <LogIn className="h-4 w-4" />
                Войти и скопировать
              </Link>
            </Button>
          )}
        </div>
      </GlassCard>
    </Layout>
  );
}

export function TripPublic() {
  const { isAuthenticated } = useAuth();
  return <TripPublicContent guest={!isAuthenticated} />;
}

export default TripPublic;
