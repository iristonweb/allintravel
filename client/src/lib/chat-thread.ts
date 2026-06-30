export type WithCreatedAt = { id?: string; createdAt?: Date | string | null };

/** Oldest first, dedupe by id (HTTP history + WebSocket). */
export function mergeChronologicalMessages<T extends WithCreatedAt>(history: T[], live: T[]): T[] {
  const byId = new Map<string, T>();
  for (const m of history) {
    if (m.id) byId.set(m.id, m);
  }
  for (const m of live) {
    if (m.id && !byId.has(m.id)) byId.set(m.id, m);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function shouldGroupChatMessages(
  prev: WithCreatedAt | undefined,
  next: WithCreatedAt,
  sameAuthor: boolean,
): boolean {
  if (!prev?.createdAt || !next.createdAt || !sameAuthor) return false;
  const prevTime = new Date(prev.createdAt).getTime();
  const nextTime = new Date(next.createdAt).getTime();
  return nextTime - prevTime < GROUP_WINDOW_MS;
}

export function chatDateSeparatorKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatChatDateSeparator(
  date: Date | string,
  labels: { today: string; yesterday: string },
  locale?: Locale,
): string {
  const d = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  return d.toLocaleDateString(locale?.code ?? "ru-RU", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

type Locale = { code?: string };
