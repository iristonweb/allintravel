import TripCard from "@/components/trips/TripCard";
import EventCard from "@/components/events/EventCard";
import HomeSectionHeader from "@/components/home/home-section-header";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import type { Event, Trip } from "@shared/schema";
import { Calendar, Users } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type HomeContinueProps = {
  trips: Trip[];
  events: Event[];
  onJoinTrip: (tripId: string) => void;
  joinedTripIds: string[];
  onRegisterEvent?: (eventId: string) => void;
  registeringEventId?: string | null;
  registeredEventIds?: string[];
};

export default function HomeContinue({
  trips,
  events,
  onJoinTrip,
  joinedTripIds,
  onRegisterEvent,
  registeringEventId,
  registeredEventIds = [],
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
              <AitButton variant="secondary" size="sm">
                <Users className="mr-2 h-4 w-4" />
                {t("home.continue.trips")}
              </AitButton>
            </Link>
            <Link href="/events">
              <AitButton variant="secondary" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                {t("home.continue.events")}
              </AitButton>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("home.continue.trips")}</h3>
          {tripsPreview.length === 0 ? (
            <AitSurface padding="md" className="text-sm text-muted-foreground">
              {t("home.continue.noTrips")}
              <div className="mt-3">
                <Link href="/trips">
                  <AitButton size="sm">{t("home.continue.openTrips")}</AitButton>
                </Link>
              </div>
            </AitSurface>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tripsPreview.map((trip) => (
                <TripCard
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
            <AitSurface padding="md" className="text-sm text-muted-foreground">
              {t("home.continue.noEvents")}
              <div className="mt-3">
                <Link href="/events">
                  <AitButton size="sm" variant="secondary">
                    {t("home.continue.browseEvents")}
                  </AitButton>
                </Link>
              </div>
            </AitSurface>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eventsPreview.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={onRegisterEvent}
                  registerPending={registeringEventId === event.id}
                  isRegistered={registeredEventIds.includes(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
