import { geocodeDestination } from "@/lib/destination-search";

/** Resolve /map href: geocode when q is set but lat/lon missing */
export async function resolveMapHref(href: string): Promise<string> {
  if (!href.startsWith("/map")) return href;

  const query = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
  const params = new URLSearchParams(query);
  const q = params.get("q")?.trim();
  const lat = params.get("lat");
  const lon = params.get("lon");

  if (!q || (lat && lon)) return href;

  const geo = await geocodeDestination(q);
  if (!geo) return href;

  params.set("lat", String(geo.lat));
  params.set("lon", String(geo.lon));
  if (!params.get("q")) params.set("q", geo.label);
  return `/map?${params.toString()}`;
}
