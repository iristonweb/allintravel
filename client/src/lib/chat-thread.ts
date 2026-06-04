export type WithCreatedAt = { id?: string; createdAt?: Date | string | null };

/** Oldest first, dedupe by id (HTTP history + WebSocket). */
export function mergeChronologicalMessages<T extends WithCreatedAt>(
  history: T[],
  live: T[],
): T[] {
  const byId = new Map<string, T>();
  for (const m of history) {
    if (m.id) byId.set(m.id, m);
  }
  for (const m of live) {
    if (m.id && !byId.has(m.id)) byId.set(m.id, m);
  }
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );
}
