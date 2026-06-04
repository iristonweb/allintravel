import { useEffect, useState } from "react";

import {
  getRecentlyViewedPlaces,
  RECENTLY_VIEWED_EVENT,
  type RecentlyViewedPlace,
} from "@/lib/recentlyViewed";

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedPlace[]>(() => getRecentlyViewedPlaces());

  useEffect(() => {
    const update = () => setItems(getRecentlyViewedPlaces());
    window.addEventListener(RECENTLY_VIEWED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return items;
}

