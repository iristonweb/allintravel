/** Split combined map query into location vs business/POI keywords */
export function parseMapSearchQuery(q: string): { location: string; keywords: string } {
  const trimmed = q.trim();
  if (!trimmed) return { location: "", keywords: "" };

  const segments = trimmed
    .split(/[,;]|(?:\s+—\s+)|(?:\s+–\s+)|(?:\s+-\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    const keywords = segments[segments.length - 1]!;
    const location = segments.slice(0, -1).join(", ");
    return { location, keywords };
  }

  return { location: trimmed, keywords: trimmed };
}
