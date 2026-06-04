import TravelCompanionCard from "@/components/travel-companion-card";
import EventCard from "@/components/event-card";
import HomeSectionHeader from "@/components/home/home-section-header";
import { Button } from "@/components/ui/button";
import type { Event, Trip } from "@shared/schema";
import { Calendar, Users } from "lucide-react";
import { Link } from "wouter";

type HomeContinueProps = {
  trips: Trip[];
  events: Event[];
  onJoinTrip: (tripId: string) => void;
  joinedTripIds: string[];
};

export default function HomeContinue({ trips, events, onJoinTrip, joinedTripIds }: HomeContinueProps) {
  const tripsPreview = trips.slice(0, 2);
  const eventsPreview = events.slice(0, 4);

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title="Продолжить"
        description="Ближайшие поездки и события — без лишнего шума"
        rightSlot={
          <div className="hidden sm:flex gap-2">
            <Link href="/trips">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Поездки
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                События
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Поездки</h3>
          {tripsPreview.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Пока нет поездок. Создайте свою или присоединитесь к группе.
              <div className="mt-3">
                <Link href="/trips">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Открыть поездки
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
          <h3 className="text-lg font-semibold">События</h3>
          {eventsPreview.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Пока нет предстоящих событий.
              <div className="mt-3">
                <Link href="/events">
                  <Button size="sm" variant="outline">
                    Смотреть события
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

