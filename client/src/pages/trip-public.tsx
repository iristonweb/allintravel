import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/app-layout";
import PublicLayout from "@/components/public-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import EmptyState from "@/components/empty-state";
import TravelMap from "@/components/maps/TravelMap";
import { Skeleton } from "@/components/ui/skeleton";
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
          title: t("tripPublic.metaTitle", { title: data.trip.title }),
          description: t("tripPublic.metaDescription", {
            stops: data.stopCount,
            destination: data.trip.destination,
          }),
          image: data.trip.imageUrl ?? `${window.location.origin}/brand/logo-ait.png`,
          url: `${window.location.origin}/trips/${id}/public`,
        }
      : null,
  );

  const copyMutation = useMutation({
    mutationFn: () => apiRequestJson<Trip>("POST", `/api/trips/${id}/copy`),
    onSuccess: (trip) => {
      toast({ title: t("tripPublic.copied") });
      window.location.href = `/trips/${trip.id}`;
    },
    onError: () => toast({ title: t("tripPublic.copyRequiresSignIn"), variant: "destructive" }),
  });

  const Layout = guest ? PublicLayout : AppLayout;

  if (isLoading) {
    return (
      <Layout contentClassName="py-8">
        <div className="space-y-4" aria-busy="true" aria-label={t("tripPublic.loading")}>
          <Skeleton className="h-64 w-full rounded-card-xl" />
          <Skeleton className="h-32 w-full rounded-card-lg" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout contentClassName="py-8">
        <EmptyState
          variant="glass"
          title={t("tripPublic.notFoundTitle")}
          description={t("tripPublic.notFound")}
          className="max-w-md mx-auto"
        />
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
      <ReelsPageLayout
        header={
          <AitSectionHeader
            title={data.trip.title}
            description={`${data.trip.destination} · ${t("tripPublic.stops", { count: data.stopCount })}`}
          />
        }
        feed={
          <AitSurface className="space-y-4">
            {mapPlaces.length > 0 && (
              <TravelMap
                places={mapPlaces}
                height="18rem"
                className="rounded-card-xl overflow-hidden"
              />
            )}

            <ol className="space-y-2">
              {data.waypoints.map((w, i) => (
                <li key={w.id} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-6 tabular-nums">{i + 1}.</span>
                  <span>
                    <MapPin className="inline h-3 w-3 mr-1 text-primary" strokeWidth={1.5} />
                    {w.place?.name ?? t("tripPublic.stopFallback")}
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
                <AitButton
                  variant="glass"
                  size="sm"
                  className="gap-2"
                  disabled={copyMutation.isPending}
                  onClick={() => copyMutation.mutate()}
                >
                  <Copy className="h-4 w-4" strokeWidth={1.5} />
                  {t("marketplace.fork")}
                </AitButton>
              ) : (
                <AitButton variant="primary" size="sm" className="gap-2" asChild>
                  <Link href={`/login?redirect=${encodeURIComponent(`/trips/${id}/public`)}`}>
                    <LogIn className="h-4 w-4" strokeWidth={1.5} />
                    {t("tripPublic.signInToCopy")}
                  </Link>
                </AitButton>
              )}
            </div>
          </AitSurface>
        }
      />
    </Layout>
  );
}

export function TripPublic() {
  const { isAuthenticated } = useAuth();
  return <TripPublicContent guest={!isAuthenticated} />;
}

export default TripPublic;
