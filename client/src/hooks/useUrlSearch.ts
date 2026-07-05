import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/** Keeps `window.location.search` in sync (including `history.replaceState` via `ait:location`). */
export function useUrlSearch(): string {
  const [location] = useLocation();
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const sync = () => setSearch(window.location.search);
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("ait:location", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("ait:location", sync);
    };
  }, [location]);

  return search;
}

export function notifyUrlSearchChange(): void {
  window.dispatchEvent(new CustomEvent("ait:location"));
}
