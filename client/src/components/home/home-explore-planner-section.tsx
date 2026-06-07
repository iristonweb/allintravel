import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InteractiveMap from "@/components/interactive-map";
import DestinationCard from "@/components/brand/destination-card";
import GlassCard from "@/components/brand/glass-card";
import HomeSectionHeader from "@/components/home/home-section-header";
import TravelMap from "@/components/maps/TravelMap";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Calendar, Globe, MapPin, Route, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place, Trip, TripWaypointWithPlace } from "@shared/schema";
import { homeDaysFromWaypoints, tripCalendarDayCount } from "@/lib/trip-days";
import { totalRouteKm } from "@/lib/routeUtils";
import { fetchBuiltRoute } from "@/lib/fetch-route";
import { DEMO_PLANNER_DAYS, DEST_ICELAND_SRC, SHOWCASE_DESTINATIONS } from "@/lib/marketing-images";

const showcaseDestinations = [...SHOWCASE_DESTINATIONS];

type PlannerDayView = {
  day: number;
  title: string;
  image: string;
  stops: string[];
  routeIds: string[];
  routePlaces?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type?: string;
  }[];
};

const DEMO_DAYS: PlannerDayView[] = DEMO_PLANNER_DAYS.map((d) => ({
  ...d,
  stops:
    d.day === 1
      ? ["Хаттегримскиркья", "Солнечный путешественник"]
      : d.day === 2
        ? ["Гейсир", "Гулльфосс"]
        : d.day === 3
          ? ["Сельяландсфосс", "Скóгафосс"]
          : ["Айсберги", "Алмазный пляж"],
  routeIds: d.day === 1 ? ["1"] : d.day === 2 ? ["1", "2"] : d.day === 3 ? ["2", "3"] : ["3", "4"],
}));

const DEMO_ROUTE = [
  { id: "1", name: "Рейкьявик", latitude: 64.1466, longitude: -21.9426, type: "attraction" },
  { id: "2", name: "Гейсир", latitude: 64.31, longitude: -20.3, type: "attraction" },
  { id: "3", name: "Сельяландсфосс", latitude: 63.6156, longitude: -19.9886, type: "attraction" },
  { id: "4", name: "Йёкюльсаурлон", latitude: 64.0484, longitude: -16.2304, type: "attraction" },
];

type MapPlace = {
  id: string;
  name: string;
  type?: string;
  latitude: number | null;
  longitude: number | null;
  averageRating?: number | null;
  priceRange?: string | null;
  address?: string | null;
};

type HomeExplorePlannerSectionProps = {
  places: Place[];
  trip?: Trip | null;
  waypoints?: TripWaypointWithPlace[];
};

type DesktopWorkspace = "world" | "route";

function DayList({
  tripTitle,
  selectedDay,
  onSelectDay,
  days,
  className,
}: {
  tripTitle: string;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  days: PlannerDayView[];
  className?: string;
}) {
  return (
    <GlassCard strong className={cn("p-4 overflow-y-auto space-y-3 h-full min-h-0", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-ait-purple mb-2 sticky top-0 bg-inherit pb-1">
        <Route className="h-4 w-4 shrink-0" />
        <span className="truncate">{tripTitle}</span>
      </div>
      {days.map((d) => (
        <motion.button
          key={d.day}
          type="button"
          onClick={() => onSelectDay(d.day)}
          whileHover={{ x: 4 }}
          className={cn(
            "w-full flex gap-3 p-3 rounded-2xl border text-left transition-colors",
            selectedDay === d.day
              ? "border-ait-purple/50 bg-ait-purple/10"
              : "border-white/8 bg-white/[0.03] hover:border-ait-purple/30",
          )}
        >
          <div
            className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0"
            style={{ backgroundImage: `url('${d.image}')` }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-ait-orange">День {d.day}</div>
            <div className="font-semibold text-sm truncate">{d.title}</div>
            <ul className="mt-1 space-y-0.5">
              {d.stops.map((s) => (
                <li key={s} className="text-xs text-muted-foreground truncate">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        </motion.button>
      ))}
    </GlassCard>
  );
}

function RouteMapPanel({
  selectedDay,
  days,
  fallbackRoute,
  className,
}: {
  selectedDay: number;
  days: PlannerDayView[];
  fallbackRoute: typeof DEMO_ROUTE;
  className?: string;
}) {
  const day = days.find((d) => d.day === selectedDay) ?? days[0];
  const routePlaces =
    day?.routePlaces && day.routePlaces.length > 0
      ? day.routePlaces
      : fallbackRoute.filter((p) => (day?.routeIds ?? []).includes(p.id));

  const points = routePlaces.map((p) => ({ lat: p.latitude, lon: p.longitude }));

  const { data: builtRoute } = useQuery({
    queryKey: ["home-route", points],
    enabled: points.length >= 2,
    queryFn: () => fetchBuiltRoute(points, "walking"),
    staleTime: 120_000,
  });

  return (
    <GlassCard
      strong
      className={cn(
        "p-0 overflow-hidden ait-gradient-border relative h-full min-h-[480px]",
        className,
      )}
    >
      <TravelMap
        places={routePlaces.length > 0 ? routePlaces : fallbackRoute}
        showRoute
        routeGeometry={builtRoute?.geometry}
        height="100%"
        className="h-full min-h-[480px] rounded-[24px]"
      />
    </GlassCard>
  );
}

function ExploreMap({
  mapPlaces,
  onNavigateMap,
  onPlaceClick,
  className,
}: {
  mapPlaces: MapPlace[];
  onNavigateMap: () => void;
  onPlaceClick: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[32px] overflow-hidden ait-gradient-border shadow-2xl min-h-[480px] h-full",
        className,
      )}
    >
      <InteractiveMap
        places={mapPlaces}
        fullHeight
        showDemoMarkers
        onPlaceClick={(place) => onPlaceClick(place.id)}
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050816] to-transparent pointer-events-none z-[999]" />
      <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4 pointer-events-none">
        <div className="pointer-events-auto flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
          {showcaseDestinations.map((d) => (
            <DestinationCard
              key={d.id}
              destination={d}
              className="snap-start"
              onClick={onNavigateMap}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function mapPlacesFromPlaces(places: Place[]): MapPlace[] {
  return places
    .filter((p) => p.latitude != null && p.longitude != null)
    .slice(0, 30)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type ?? undefined,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      averageRating: p.averageRating != null ? Number(p.averageRating) : undefined,
      priceRange: p.priceRange ?? undefined,
      address: p.address,
    }));
}

function WorkspaceToggle({
  value,
  onChange,
  className,
}: {
  value: DesktopWorkspace;
  onChange: (v: DesktopWorkspace) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 ait-nav-pill rounded-full p-1 w-fit", className)}>
      <button
        type="button"
        onClick={() => onChange("world")}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors",
          value === "world" ? "ait-nav-active text-white" : "text-slate-400 hover:text-white",
        )}
      >
        <Globe className="h-4 w-4" />
        Карта мира
      </button>
      <button
        type="button"
        onClick={() => onChange("route")}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors",
          value === "route" ? "ait-nav-active text-white" : "text-slate-400 hover:text-white",
        )}
      >
        <Route className="h-4 w-4" />
        Маршрут
      </button>
    </div>
  );
}

export default function HomeExplorePlannerSection({
  places,
  trip,
  waypoints = [],
}: HomeExplorePlannerSectionProps) {
  const [, navigate] = useLocation();
  const [selectedDay, setSelectedDay] = useState(1);
  const [desktopWorkspace, setDesktopWorkspace] = useState<DesktopWorkspace>("world");
  const tripHref = trip ? `/trips/${trip.id}` : "/trips";
  const hasRealRoute = !!trip && waypoints.length > 0;
  const realHomeDays = trip ? homeDaysFromWaypoints(trip, waypoints) : [];
  const displayDays =
    hasRealRoute && realHomeDays.length > 0
      ? realHomeDays.map((d) => ({
          day: d.day,
          title: d.title,
          image: d.image ?? DEST_ICELAND_SRC,
          stops: d.stops,
          routeIds: d.routePlaces.map((p) => p.id),
          routePlaces: d.routePlaces,
        }))
      : DEMO_DAYS;
  const tripTitle = trip?.title ?? (hasRealRoute ? "Ваш маршрут" : "Создайте поездку");
  const mapPlaces = mapPlacesFromPlaces(places);
  const totalDays = trip ? tripCalendarDayCount(trip) : 12;
  const stopCount = waypoints.length;
  const km = totalRouteKm(
    waypoints
      .filter((w) => w.place?.latitude != null)
      .map((w) => [Number(w.place!.latitude), Number(w.place!.longitude)] as [number, number]),
  );
  const budgetLabel = trip?.budgetMax ?? trip?.budgetMin;

  const routeSplit = (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr] gap-4 min-h-[520px] h-[min(70vh,640px)]">
      {hasRealRoute ? (
        <>
          <DayList
            tripTitle={tripTitle}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            days={displayDays}
            className="max-h-full"
          />
          <RouteMapPanel
            selectedDay={selectedDay}
            days={displayDays}
            fallbackRoute={DEMO_ROUTE}
            className="min-h-0"
          />
        </>
      ) : (
        <GlassCard
          strong
          className="col-span-full p-8 flex flex-col items-center justify-center text-center min-h-[320px]"
        >
          <Route className="h-10 w-10 text-ait-purple mb-4" />
          <h3 className="text-lg font-semibold mb-2">Спланируйте первую поездку</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Добавьте остановки в планировщик — здесь появится ваш реальный маршрут по дням, а не
            демо.
          </p>
          <Link href="/trips">
            <Button variant="premium">Создать поездку</Button>
          </Link>
        </GlassCard>
      )}
    </div>
  );

  return (
    <motion.section
      id="explore"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="space-y-6 scroll-mt-28"
    >
      <HomeSectionHeader
        title="Исследуй и планируй"
        description="Интерактивная карта мира и маршруты по дням — в одном рабочем пространстве"
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <Link href="/map">
              <Button variant="glass" size="sm">
                Карта
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={tripHref}>
              <Button variant="outline" size="sm" className="border-white/15">
                Планировщик
              </Button>
            </Link>
          </div>
        }
      />

      <div className="hidden xl:block space-y-4">
        <WorkspaceToggle value={desktopWorkspace} onChange={setDesktopWorkspace} />
        {desktopWorkspace === "world" ? (
          <ExploreMap
            mapPlaces={mapPlaces}
            onNavigateMap={() => navigate("/map")}
            onPlaceClick={(id) => navigate(`/place/${id}`)}
            className="min-h-[560px]"
          />
        ) : (
          routeSplit
        )}
      </div>

      <div className="xl:hidden">
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList className="ait-nav-pill rounded-full p-1 h-auto bg-transparent border-0 w-full flex">
            <TabsTrigger
              value="map"
              className="flex-1 rounded-full data-[state=active]:ait-nav-active data-[state=active]:text-white text-slate-400"
            >
              Карта мира
            </TabsTrigger>
            <TabsTrigger
              value="route"
              className="flex-1 rounded-full data-[state=active]:ait-nav-active data-[state=active]:text-white text-slate-400"
            >
              Маршрут
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-0">
            <ExploreMap
              mapPlaces={mapPlaces}
              onNavigateMap={() => navigate("/map")}
              onPlaceClick={(id) => navigate(`/place/${id}`)}
            />
          </TabsContent>
          <TabsContent value="route" className="mt-0">
            {routeSplit}
          </TabsContent>
        </Tabs>
      </div>

      <GlassCard strong className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ait-purple" />
            <strong className="text-white">{hasRealRoute ? totalDays : "—"}</strong> дней
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ait-orange" />
            <strong className="text-white">{hasRealRoute ? stopCount : "—"}</strong> локаций
          </span>
          <span>
            <strong className="text-white">{hasRealRoute && km ? km : "—"}</strong>{" "}
            <span className="text-muted-foreground">км</span>
          </span>
          <span>
            <strong className="text-ait-gold">
              {budgetLabel != null ? `$${budgetLabel}` : "—"}
            </strong>{" "}
            <span className="text-muted-foreground">бюджет</span>
          </span>
        </div>
        <Link href={tripHref}>
          <span className="ait-btn-glow rounded-2xl px-6 py-3 text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity">
            <Sparkles className="h-4 w-4" />
            {hasRealRoute ? "Открыть планировщик" : "Создать поездку"}
          </span>
        </Link>
      </GlassCard>
    </motion.section>
  );
}
