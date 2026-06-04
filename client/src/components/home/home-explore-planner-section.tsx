import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import InteractiveMap from "@/components/interactive-map";
import DestinationCard from "@/components/brand/destination-card";
import GlassCard from "@/components/brand/glass-card";
import HomeSectionHeader from "@/components/home/home-section-header";
import TravelMap from "@/components/maps/TravelMap";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Calendar, Globe, MapPin, Route, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place, Trip } from "@shared/schema";

const showcaseDestinations = [
  {
    id: "bali",
    name: "Бали",
    imageUrl: "https://images.unsplash.com/photo-1537996195241-795aa0a07e0f?w=500&q=85",
    placesCount: 342,
    rating: 4.8,
  },
  {
    id: "iceland",
    name: "Исландия",
    imageUrl: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=500&q=85",
    placesCount: 128,
    rating: 4.9,
  },
  {
    id: "peru",
    name: "Перу",
    imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=500&q=85",
    placesCount: 156,
    rating: 4.7,
  },
  {
    id: "italy",
    name: "Италия",
    imageUrl: "https://images.unsplash.com/photo-1516483638260-f4dbaf9a9346?w=500&q=85",
    placesCount: 412,
    rating: 4.9,
  },
  {
    id: "japan",
    name: "Япония",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e912f437?w=500&q=85",
    placesCount: 276,
    rating: 4.9,
  },
];

const DEMO_DAYS = [
  {
    day: 1,
    title: "Рейкьявик",
    image: "https://images.unsplash.com/photo-1529963188137-1429c77ce9bf?w=200&q=80",
    stops: ["Хаттегримскиркья", "Солнечный путешественник"],
    routeIds: ["1"],
  },
  {
    day: 2,
    title: "Золотое кольцо",
    image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=200&q=80",
    stops: ["Гейсир", "Гулльфосс"],
    routeIds: ["1", "2"],
  },
  {
    day: 3,
    title: "Южный берег",
    image: "https://images.unsplash.com/photo-1518837695005-2083099ee35b?w=200&q=80",
    stops: ["Сельяландсфосс", "Скóгафосс"],
    routeIds: ["2", "3"],
  },
  {
    day: 4,
    title: "Лагуна Йёкюльсаурлон",
    image: "https://images.unsplash.com/photo-1531168556467-80abfa572935?w=200&q=80",
    stops: ["Айсберги", "Алмазный пляж"],
    routeIds: ["3", "4"],
  },
];

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
};

type DesktopWorkspace = "world" | "route";

function DayList({
  tripTitle,
  selectedDay,
  onSelectDay,
  className,
}: {
  tripTitle: string;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  className?: string;
}) {
  return (
    <GlassCard strong className={cn("p-4 overflow-y-auto space-y-3 h-full min-h-0", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-ait-purple mb-2 sticky top-0 bg-inherit pb-1">
        <Route className="h-4 w-4 shrink-0" />
        <span className="truncate">{tripTitle}</span>
      </div>
      {DEMO_DAYS.map((d) => (
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

function RouteMapPanel({ selectedDay, className }: { selectedDay: number; className?: string }) {
  const day = DEMO_DAYS.find((d) => d.day === selectedDay) ?? DEMO_DAYS[0];
  const routePlaces = DEMO_ROUTE.filter((p) => day.routeIds.includes(p.id));

  return (
    <GlassCard
      strong
      className={cn("p-0 overflow-hidden ait-gradient-border relative h-full min-h-[480px]", className)}
    >
      <TravelMap
        places={routePlaces.length > 0 ? routePlaces : DEMO_ROUTE}
        showRoute
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
      latitude: p.latitude,
      longitude: p.longitude,
      averageRating: p.averageRating,
      priceRange: p.priceRange,
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

export default function HomeExplorePlannerSection({ places, trip }: HomeExplorePlannerSectionProps) {
  const [, navigate] = useLocation();
  const [selectedDay, setSelectedDay] = useState(1);
  const [desktopWorkspace, setDesktopWorkspace] = useState<DesktopWorkspace>("route");
  const tripHref = trip ? `/trips/${trip.id}` : "/trips";
  const tripTitle = trip?.title ?? "Исландия 2026";
  const mapPlaces = mapPlacesFromPlaces(places);

  const routeSplit = (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr] gap-4 min-h-[520px] h-[min(70vh,640px)]">
      <DayList
        tripTitle={tripTitle}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        className="max-h-full"
      />
      <RouteMapPanel selectedDay={selectedDay} className="min-h-0" />
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
            <strong className="text-white">12</strong> дней
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ait-orange" />
            <strong className="text-white">8</strong> локаций
          </span>
          <span>
            <strong className="text-white">1240</strong>{" "}
            <span className="text-muted-foreground">км</span>
          </span>
          <span>
            <strong className="text-ait-gold">$2,450</strong>{" "}
            <span className="text-muted-foreground">бюджет</span>
          </span>
        </div>
        <Link href={tripHref}>
          <span className="ait-btn-glow rounded-2xl px-6 py-3 text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity">
            <Sparkles className="h-4 w-4" />
            Оптимизировать маршрут
          </span>
        </Link>
      </GlassCard>
    </motion.section>
  );
}
