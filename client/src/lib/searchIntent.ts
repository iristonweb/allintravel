const SEARCH_INTENT_KEY = "ait:search-intent";

export type SearchIntent = {
  path: string;
  savedAt: number;
};

const ALLOWED_PREFIXES = ["/places", "/map", "/destinations", "/trips"];

export function saveSearchIntent(path: string): void {
  if (!ALLOWED_PREFIXES.some((p) => path.startsWith(p))) return;
  sessionStorage.setItem(
    SEARCH_INTENT_KEY,
    JSON.stringify({ path, savedAt: Date.now() } satisfies SearchIntent),
  );
}

export function consumeSearchIntent(): string | null {
  const raw = sessionStorage.getItem(SEARCH_INTENT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(SEARCH_INTENT_KEY);
  try {
    const parsed = JSON.parse(raw) as SearchIntent;
    if (Date.now() - parsed.savedAt > 30 * 60 * 1000) return null;
    return parsed.path;
  } catch {
    return null;
  }
}
