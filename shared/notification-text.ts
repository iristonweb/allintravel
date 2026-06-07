import type { UserLabelFields } from "./user-display";
import { getUserDisplayLabel } from "./user-display";

export function truncateNotificationPreview(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** «Анна оценила…» / «Анна и Боб оценили…» / «Анна и ещё 3 оценили…» */
export function formatPostLikeActorsLabel(actors: UserLabelFields[], totalCount: number): string {
  const names = actors.map((a) => getUserDisplayLabel(a));
  if (totalCount <= 1) return names[0] ?? "Кто-то";
  if (totalCount === 2) {
    if (names.length >= 2) return `${names[0]} и ${names[1]}`;
    if (names.length === 1) return `${names[0]} и ещё один`;
    return "Два пользователя";
  }
  return `${names[0] ?? "Кто-то"} и ещё ${totalCount - 1}`;
}

export function formatPostCommentNotificationBody(
  actors: UserLabelFields[],
  totalCount: number,
  postContent: string,
  latestComment: string,
): string {
  const label = formatPostLikeActorsLabel(actors, totalCount);
  const verb = totalCount > 1 ? "прокомментировали" : "прокомментировала";
  const preview = truncateNotificationPreview(postContent, 40);
  const comment = truncateNotificationPreview(latestComment, 100);
  if (preview) {
    return `${label} ${verb} «${preview}»: «${comment}»`;
  }
  return `${label} ${verb} вашу публикацию: «${comment}»`;
}

export function formatPostLikeNotificationBody(
  actors: UserLabelFields[],
  totalCount: number,
  postContent: string,
): string {
  const label = formatPostLikeActorsLabel(actors, totalCount);
  const verb = totalCount > 1 ? "оценили" : "оценила";
  const preview = truncateNotificationPreview(postContent);
  if (preview) {
    return `${label} ${verb} вашу публикацию: «${preview}»`;
  }
  return `${label} ${verb} вашу публикацию`;
}
