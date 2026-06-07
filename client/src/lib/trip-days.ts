import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Trip, TripWaypointWithPlace } from "@shared/schema";

export function tripCalendarDayCount(trip: Pick<Trip, "startDate" | "endDate">): number {
  if (!trip.startDate || !trip.endDate) return 1;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

export function dayLabel(trip: Pick<Trip, "startDate">, dayNumber: number): string {
  if (!trip.startDate) return `День ${dayNumber}`;
  const date = addDays(new Date(trip.startDate), dayNumber - 1);
  return `День ${dayNumber} · ${format(date, "d MMM", { locale: ru })}`;
}

export function effectiveDayNumber(waypoint: TripWaypointWithPlace, fallbackIndex: number): number {
  return waypoint.dayNumber ?? fallbackIndex + 1;
}

export function groupWaypointsByDay(
  waypoints: TripWaypointWithPlace[],
  totalDays: number,
): Map<number, TripWaypointWithPlace[]> {
  const map = new Map<number, TripWaypointWithPlace[]>();
  for (let d = 1; d <= totalDays; d++) map.set(d, []);
  const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  sorted.forEach((w, index) => {
    const day = Math.min(totalDays, Math.max(1, effectiveDayNumber(w, index)));
    map.get(day)!.push(w);
  });
  return map;
}

/** Distribute stops evenly across calendar days (order preserved). */
export function distributeStopsAcrossDays(
  waypoints: TripWaypointWithPlace[],
  totalDays: number,
): { waypointId: string; dayNumber: number; orderIndex: number }[] {
  const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  if (sorted.length === 0 || totalDays < 1) return [];
  const perDay = Math.max(1, Math.ceil(sorted.length / totalDays));
  return sorted.map((w, index) => ({
    waypointId: w.id,
    dayNumber: Math.min(totalDays, Math.floor(index / perDay) + 1),
    orderIndex: index,
  }));
}

export type HomeDayView = {
  day: number;
  title: string;
  image?: string;
  stops: string[];
  routePlaces: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type?: string;
  }[];
};

export function homeDaysFromWaypoints(
  trip: Trip,
  waypoints: TripWaypointWithPlace[],
): HomeDayView[] {
  const totalDays = tripCalendarDayCount(trip);
  const byDay = groupWaypointsByDay(waypoints, totalDays);
  const days: HomeDayView[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const stops = byDay.get(d) ?? [];
    if (stops.length === 0 && d > 1 && days.every((x) => x.stops.length === 0)) continue;
    const routePlaces = stops
      .filter((w) => w.place?.latitude != null && w.place?.longitude != null)
      .map((w) => ({
        id: w.place!.id,
        name: w.place!.name,
        latitude: Number(w.place!.latitude),
        longitude: Number(w.place!.longitude),
        type: w.place!.type ?? undefined,
      }));
    days.push({
      day: d,
      title: routePlaces[0]?.name ?? dayLabel(trip, d),
      image: stops[0]?.place?.imageUrl ?? undefined,
      stops: routePlaces.map((p) => p.name),
      routePlaces,
    });
  }
  return days.length > 0 ? days : [];
}
