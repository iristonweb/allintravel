export type ChatRoomSearchFields = {
  title: string;
  description?: string | null;
  slug: string;
};

export function normalizeChatSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length]!;
}

/** Higher = better match (Telegram-style: exact, prefix, contains, fuzzy). */
export function scoreChatRoomMatch(query: string, room: ChatRoomSearchFields): number {
  const q = normalizeChatSearchText(query);
  if (q.length < 2) return 0;

  const title = normalizeChatSearchText(room.title);
  const slug = normalizeChatSearchText(room.slug);
  const desc = normalizeChatSearchText(room.description ?? "");

  if (title === q || slug === q) return 100;
  if (title.startsWith(q) || slug.startsWith(q)) return 90;
  if (title.includes(q) || slug.includes(q)) return 80;
  if (desc.includes(q)) return 65;

  const qTokens = q.split(" ").filter(Boolean);
  const titleTokens = title.split(" ").filter(Boolean);
  let tokenHits = 0;
  for (const qt of qTokens) {
    if (titleTokens.some((t) => t.startsWith(qt) || t.includes(qt))) tokenHits++;
    else if (slug.includes(qt)) tokenHits++;
  }
  if (tokenHits > 0) return 55 + tokenHits * 8;

  const titlePrefix = title.slice(0, Math.max(q.length, title.length));
  const dist = levenshtein(q, titlePrefix.slice(0, q.length + 3));
  if (dist <= 2) return 45 - dist * 10;

  const slugDist = levenshtein(q, slug.slice(0, q.length + 3));
  if (slugDist <= 2) return 40 - slugDist * 10;

  return 0;
}
