const KEY = "ait-story-views";

export function getStoryViewedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markStoryViewed(postId: string): void {
  const set = getStoryViewedIds();
  set.add(postId);
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
}

export function isStoryViewed(postId: string): boolean {
  return getStoryViewedIds().has(postId);
}
