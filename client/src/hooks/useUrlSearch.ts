import { useSearch } from "wouter";

/**
 * Current `window` search including leading `?` (or `""`).
 * Driven by wouter's history patch — updates on Link pushState / replaceState.
 */
export function useUrlSearch(): string {
  const search = useSearch();
  return search ? `?${search}` : "";
}

/** @deprecated Prefer relying on wouter `useSearch`; kept for legacy callers. */
export function notifyUrlSearchChange(): void {
  window.dispatchEvent(new CustomEvent("ait:location"));
}
