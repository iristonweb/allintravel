import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, X, Film, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import TravelMap from "@/components/maps/TravelMap";
import { apiRequestJson } from "@/lib/queryClient";
import { fetchBuiltRoute } from "@/lib/fetch-route";
import { groupWaypointsByDay, dayLabel, tripCalendarDayCount } from "@/lib/trip-days";
import { totalRouteKm } from "@/lib/routeUtils";
import type { Trip, TripWaypointWithPlace } from "@shared/schema";

type TripCinemaProps = {
  trip: Trip;
  tripId: string;
  waypoints: TripWaypointWithPlace[];
  onClose: () => void;
};

type CinemaStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  day: number;
};

const STEP_MS = 2800;

export default function TripCinema({ trip, tripId, waypoints, onClose }: TripCinemaProps) {
  const totalDays = tripCalendarDayCount(trip);
  const byDay = useMemo(() => groupWaypointsByDay(waypoints, totalDays), [waypoints, totalDays]);

  const days = useMemo(() => {
    const list: { day: number; label: string; stops: CinemaStop[] }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const stops = (byDay.get(d) ?? [])
        .filter((w) => w.place?.latitude != null)
        .map((w) => ({
          id: w.id,
          name: w.place!.name,
          lat: Number(w.place!.latitude),
          lon: Number(w.place!.longitude),
          day: d,
        }));
      if (stops.length > 0) {
        list.push({ day: d, label: dayLabel(trip, d), stops });
      }
    }
    return list;
  }, [byDay, totalDays, trip]);

  const flatStops = useMemo(() => days.flatMap((d) => d.stops), [days]);

  const [playing, setPlaying] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "play" | "finale">("intro");
  const [watched, setWatched] = useState(false);

  const currentStop = flatStops[stepIndex];
  const currentDayInfo = days.find((d) => d.day === currentStop?.day);

  const visiblePlaces = useMemo(() => {
    if (!currentStop) return [];
    const upto = flatStops.slice(0, stepIndex + 1);
    return upto.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: String(s.lat),
      longitude: String(s.lon),
      type: "attraction",
    }));
  }, [flatStops, stepIndex, currentStop]);

  const routeCoords = useMemo(
    () => visiblePlaces.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]),
    [visiblePlaces],
  );

  const routePoints = useMemo(
    () =>
      visiblePlaces.map((p) => ({
        lat: Number(p.latitude),
        lon: Number(p.longitude),
      })),
    [visiblePlaces],
  );

  const { data: builtRoute } = useQuery({
    queryKey: ["trip-cinema-route", routePoints],
    enabled: routePoints.length >= 2,
    queryFn: () => fetchBuiltRoute(routePoints, "walking"),
    staleTime: 60_000,
  });

  const totalKm = builtRoute?.distanceKm ?? totalRouteKm(routeCoords);

  const mapFocus = currentStop
    ? { lat: currentStop.lat, lon: currentStop.lon, zoom: 12 }
    : null;

  const advance = useCallback(() => {
    if (phase === "intro") {
      setPhase("play");
      return;
    }
    if (stepIndex >= flatStops.length - 1) {
      setPhase("finale");
      setPlaying(false);
      if (!watched) {
        setWatched(true);
        void apiRequestJson("POST", `/api/trips/${tripId}/cinema/watch`).catch(() => {});
      }
      return;
    }
    setStepIndex((i) => i + 1);
  }, [phase, stepIndex, flatStops.length, watched, tripId]);

  useEffect(() => {
    if (!playing || phase === "finale") return;
    const t = window.setInterval(advance, phase === "intro" ? 2200 : STEP_MS);
    return () => window.clearInterval(t);
  }, [playing, phase, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (flatStops.length < 2) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#050816] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Film className="h-12 w-12 text-ait-purple mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Нужно больше остановок</p>
          <p className="text-muted-foreground text-sm mb-6">
            Добавьте минимум 2 точки в маршрут, чтобы проиграть Trip Cinema.
          </p>
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#050816] flex flex-col">
      <div className="absolute inset-0 opacity-40">
        <TravelMap
          places={visiblePlaces}
          height="100%"
          showRoute
          routeGeometry={builtRoute?.geometry}
          mapFocus={mapFocus}
          className="h-full w-full rounded-none"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-[#050816]/70 pointer-events-none" />

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:bg-black/70"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-3"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-ait-orange font-bold">Trip Cinema</p>
              <h2 className="text-3xl sm:text-4xl font-bold">{trip.title}</h2>
              <p className="text-lg text-muted-foreground">{trip.destination}</p>
              <p className="text-sm text-white/60">
                {flatStops.length} остановок · {days.length} {days.length === 1 ? "день" : "дней"}
              </p>
            </motion.div>
          )}

          {phase === "play" && currentStop && (
            <motion.div
              key={`${currentStop.id}-${stepIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              <p className="text-xs uppercase tracking-widest text-ait-purple">
                {currentDayInfo?.label ?? `День ${currentStop.day}`}
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold">{currentStop.name}</h3>
              <p className="text-sm text-white/50">
                Остановка {stepIndex + 1} из {flatStops.length}
              </p>
            </motion.div>
          )}

          {phase === "finale" && (
            <motion.div
              key="finale"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Sparkles className="h-10 w-10 text-ait-orange" />
              <h2 className="text-3xl font-bold">Поездка в кадре</h2>
              <p className="text-muted-foreground">
                {flatStops.length} остановок · ~{Math.round(totalKm)} км · {trip.destination}
              </p>
              {watched && (
                <p className="text-sm text-ait-orange">+ AIT за первый просмотр (если ещё не получали)</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-white/20"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ait-purple to-ait-orange transition-all duration-500"
              style={{
                width: `${phase === "finale" ? 100 : ((stepIndex + 1) / flatStops.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {phase === "intro" ? "…" : `${Math.min(stepIndex + 1, flatStops.length)}/${flatStops.length}`}
          </span>
        </div>
      </div>
    </div>
  );
}
