import type { UserLabelFields } from "./user-display";
import { getUserDisplayLabel } from "./user-display";
import { notificationCopy } from "./notification-copy";
import type { NotificationLocale } from "./notification-locale";

export function truncateNotificationPreview(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function formatPostLikeActorsLabel(
  actors: UserLabelFields[],
  totalCount: number,
  locale: NotificationLocale = "ru",
): string {
  const copy = notificationCopy(locale);
  const names = actors.map((a) => getUserDisplayLabel(a));
  if (totalCount <= 1) return names[0] ?? copy.someone;
  if (totalCount === 2) {
    if (names.length >= 2) return copy.actorsTwo(names[0]!, names[1]!);
    if (names.length === 1) return copy.actorsOneAndAnother(names[0]!);
    return copy.twoUsers;
  }
  return copy.actorsAndMore(names[0] ?? copy.someone, totalCount - 1);
}

export function formatPostCommentNotificationBody(
  actors: UserLabelFields[],
  totalCount: number,
  postContent: string,
  latestComment: string,
  locale: NotificationLocale = "ru",
): string {
  const copy = notificationCopy(locale);
  const label = formatPostLikeActorsLabel(actors, totalCount, locale);
  const verb = totalCount > 1 ? copy.postCommentVerbPlural : copy.postCommentVerbSingle;
  const preview = truncateNotificationPreview(postContent, 40);
  const comment = truncateNotificationPreview(latestComment, 100);
  if (preview) {
    return `${label} ${verb} «${preview}»: «${comment}»`;
  }
  return `${label} ${verb} ${copy.postTarget}: «${comment}»`;
}

export function formatPostLikeNotificationBody(
  actors: UserLabelFields[],
  totalCount: number,
  postContent: string,
  locale: NotificationLocale = "ru",
): string {
  const copy = notificationCopy(locale);
  const label = formatPostLikeActorsLabel(actors, totalCount, locale);
  const verb = totalCount > 1 ? copy.postLikeVerbPlural : copy.postLikeVerbSingle;
  const preview = truncateNotificationPreview(postContent);
  if (preview) {
    return `${label} ${verb} ${copy.postTarget}: «${preview}»`;
  }
  return `${label} ${verb} ${copy.postTarget}`;
}

export function postLikeNotificationTitle(locale: NotificationLocale = "ru"): string {
  return notificationCopy(locale).postLikeTitle;
}

export function postCommentNotificationTitle(locale: NotificationLocale = "ru"): string {
  return notificationCopy(locale).postCommentTitle;
}
