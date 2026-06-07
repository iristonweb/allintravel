import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import TripPlannerLayout from "@/components/planner/trip-planner-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";
import EmptyState from "@/components/empty-state";
import type { Trip } from "@shared/schema";
import type { TripWaypointWithPlace } from "@shared/schema";
import { useState } from "react";

export function TripDetail() {
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
        <p className="text-muted-foreground">Поездка не указана</p>
        <Link href="/trips">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />К поездкам
          </Button>
        </Link>
      </AppLayout>
    );
  }

  if (tripLoading) {
    return (
      <AppLayout>
        <div className="h-64 animate-pulse bg-white/5 rounded-2xl" />
      </AppLayout>
    );
  }

  if (tripError) {
    return (
      <AppLayout>
        <EmptyState
          icon={AlertCircle}
          title="Не удалось загрузить поездку"
          action={
            <Button variant="outline" onClick={() => refetchTrip()}>
              Повторить
            </Button>
          }
        />
        <Link href="/trips">
          <Button variant="outline" className="mt-4 mx-auto block">
            <ArrowLeft className="mr-2 h-4 w-4" />К поездкам
          </Button>
        </Link>
      </AppLayout>
    );
  }

  if (!trip) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Поездка не найдена</p>
        <Link href="/trips">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />К поездкам
          </Button>
        </Link>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="pb-28">
      <AppBreadcrumbs items={[{ label: "Поездки", href: "/trips" }, { label: trip.title }]} />
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
