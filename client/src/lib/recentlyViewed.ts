export type RecentlyViewedPlace = {
  id: string;
  type?: string | null;
  viewedAt: number;
};

const KEY = "ait.recentlyViewedPlaces.v1";
const MAX_ITEMS = 20;
export const RECENTLY_VIEWED_EVENT = "ait:recentlyViewed";

export function getRecentlyViewedPlaces(): RecentlyViewedPlace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string" && typeof x.viewedAt === "number")
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function pushRecentlyViewedPlace(input: { id: string; type?: string | null }) {
  try {
    const current = getRecentlyViewedPlaces();
    const nextItem: RecentlyViewedPlace = {
      id: input.id,
      type: input.type ?? null,
      viewedAt: Date.now(),
    };
    const deduped = [nextItem, ...current.filter((x) => x.id !== input.id)];
    localStorage.setItem(KEY, JSON.stringify(deduped.slice(0, MAX_ITEMS)));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    // ignore storage failures
  }
}

export function getRecentTypePreference(): string | undefined {
  const items = getRecentlyViewedPlaces();
  const counts = new Map<string, number>();
  for (const it of items) {
    const t = it.type ?? undefined;
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  counts.forEach((c, t) => {
    if (c > bestCount) {
      best = t;
      bestCount = c;
    }
  });
  return best;
}

export function getLastViewedPlace(): RecentlyViewedPlace | undefined {
  return getRecentlyViewedPlaces()[0];
}
