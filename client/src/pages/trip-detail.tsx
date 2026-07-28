import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import TripPlannerLayout from "@/components/planner/trip-planner-layout";
import TripPlannerSkeleton from "@/components/planner/TripPlannerSkeleton";
import AitButton from "@/components/ait-ui/AitButton";
import { ArrowLeft, AlertCircle } from "lucide-react";
import TravelJourneyStrip from "@/components/journey/TravelJourneyStrip";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";
import EmptyState from "@/components/empty-state";
import type { Trip } from "@shared/schema";
import type { TripWaypointWithPlace } from "@shared/schema";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function TripDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [addOpen, setAddOpen] = useState(false);

  const {
    data: trip,
    isLoading: tripLoading,
    isError: tripError,
    refetch: refetchTrip,
  } = useQuery<Trip>({
    queryKey: ["/api/trips", id],
    enabled: !!id,
  });

  const { data: waypoints = [], isLoading: waypointsLoading } = useQuery<TripWaypointWithPlace[]>({
    queryKey: ["/api/trips", id, "waypoints"],
    enabled: !!id,
  });

  if (!id) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">{t("tripDetail.noId")}</p>
        <Link href="/trips">
          <AitButton variant="secondary" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("tripDetail.backToTrips")}
          </AitButton>
        </Link>
      </AppLayout>
    );
  }

  if (tripLoading) {
    return (
      <AppLayout contentClassName="pb-28">
        <TripPlannerSkeleton />
      </AppLayout>
    );
  }

  if (tripError) {
    return (
      <AppLayout>
        <EmptyState
          icon={AlertCircle}
          title={t("tripDetail.loadError")}
          action={
            <AitButton variant="secondary" onClick={() => refetchTrip()}>
              {t("common.retry")}
            </AitButton>
          }
        />
        <Link href="/trips">
          <AitButton variant="secondary" className="mt-4 mx-auto block gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("tripDetail.backToTrips")}
          </AitButton>
        </Link>
      </AppLayout>
    );
  }

  if (!trip) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">{t("tripDetail.notFound")}</p>
        <Link href="/trips">
          <AitButton variant="secondary" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("tripDetail.backToTrips")}
          </AitButton>
        </Link>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="pb-28">
      <AppBreadcrumbs
        items={[{ label: t("tripDetail.tripsBreadcrumb"), href: "/trips" }, { label: trip.title }]}
      />
      <TravelJourneyStrip activeStep="plan" className="mb-4" />
      <TripPlannerLayout
        trip={trip}
        tripId={id}
        waypoints={waypoints}
        waypointsLoading={waypointsLoading}
        addOpen={addOpen}
        setAddOpen={setAddOpen}
      />
    </AppLayout>
  );
}

export default TripDetail;
