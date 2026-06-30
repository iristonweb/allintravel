import TravelCompanionCard from "@/components/travel-companion-card";
import EventCard from "@/components/event-card";
import HomeSectionHeader from "@/components/home/home-section-header";
import { Button } from "@/components/ui/button";
import type { Event, Trip } from "@shared/schema";
import { Calendar, Users } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type HomeContinueProps = {
  trips: Trip[];
  events: Event[];
  onJoinTrip: (tripId: string) => void;
  joinedTripIds: string[];
};

export default function HomeContinue({
  trips,
  events,
  onJoinTrip,
  joinedTripIds,
}: HomeContinueProps) {
  const { t } = useTranslation();
  const tripsPreview = trips.slice(0, 2);
  const eventsPreview = events.slice(0, 4);

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title={t("home.continue.title")}
        description={t("home.continue.description")}
        rightSlot={
          <div className="hidden sm:flex gap-2">
            <Link href="/trips">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                {t("home.continue.trips")}
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                {t("home.continue.events")}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("home.continue.trips")}</h3>
          {tripsPreview.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              {t("home.continue.noTrips")}
              <div className="mt-3">
                <Link href="/trips">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    {t("home.continue.openTrips")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tripsPreview.map((trip) => (
                <TravelCompanionCard
                  key={trip.id}
                  trip={trip}
                  onJoin={onJoinTrip}
                  isJoined={joinedTripIds.includes(trip.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("home.continue.events")}</h3>
          {eventsPreview.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              {t("home.continue.noEvents")}
              <div className="mt-3">
                <Link href="/events">
                  <Button size="sm" variant="outline">
                    {t("home.continue.browseEvents")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eventsPreview.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
