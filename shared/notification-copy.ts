import type { NotificationLocale } from "./notification-locale";

export function notificationCopy(locale: NotificationLocale) {
  return locale === "en" ? EN : RU;
}

const EN = {
  someone: "Someone",
  twoUsers: "Two users",
  userFallback: "User",
  postLikeTitle: "Post liked",
  postCommentTitle: "Post comment",
  postLikeVerbSingle: "liked",
  postLikeVerbPlural: "liked",
  postCommentVerbSingle: "commented on",
  postCommentVerbPlural: "commented on",
  postTarget: "your post",
  messageReactionTitle: "Message reaction",
  chatReactionTitle: (roomTitle: string) => `Reaction in «${roomTitle}»`,
  messageReactionBody: (name: string, emoji: string, preview: string) =>
    `${name} reacted ${emoji} to «${preview}»`,
  messageReactionBodyFallback: (name: string, emoji: string) =>
    `${name} reacted ${emoji} to your message`,
  chatReactionBody: (name: string, emoji: string, preview: string) =>
    `${name} reacted ${emoji}: «${preview}»`,
  chatReactionBodyFallback: (name: string, emoji: string) =>
    `${name} reacted ${emoji} to your message`,
  friendRequestTitle: "Friend request",
  friendRequestBody: (name: string) => `${name} wants to add you as a friend`,
  friendAcceptedTitle: "Request accepted",
  friendAcceptedBody: (name: string) => `${name} accepted your friend request`,
  messageTitle: (name: string) => `Message from ${name}`,
  tripJoinTitle: "New trip member",
  tripJoinBody: (name: string, tripTitle: string) => `${name} joined «${tripTitle}»`,
  tripInviteTitle: "Trip invitation",
  tripInviteBody: (name: string, tripTitle: string) =>
    `${name} added you to «${tripTitle}» — group chat is open`,
  eventRegistrationTitle: "Event registration",
  eventRegistrationBody: (name: string, eventTitle: string) =>
    `${name} registered for «${eventTitle}»`,
  groupJoinTitle: "New group member",
  groupJoinBody: (name: string, roomTitle: string) => `${name} joined «${roomTitle}»`,
  messagePinnedTitle: (roomTitle: string) => `Pinned in «${roomTitle}»`,
  messagePinnedBody: (name: string, body: string) => `${name}: ${body}`,
  actorsTwo: (first: string, second: string) => `${first} and ${second}`,
  actorsOneAndAnother: (name: string) => `${name} and someone else`,
  actorsAndMore: (name: string, count: number) => `${name} and ${count} others`,
} as const;

const RU = {
  someone: "Кто-то",
  twoUsers: "Два пользователя",
  userFallback: "Пользователь",
  postLikeTitle: "Оценка публикации",
  postCommentTitle: "Комментарий к публикации",
  postLikeVerbSingle: "оценила",
  postLikeVerbPlural: "оценили",
  postCommentVerbSingle: "прокомментировала",
  postCommentVerbPlural: "прокомментировали",
  postTarget: "вашу публикацию",
  messageReactionTitle: "Реакция на сообщение",
  chatReactionTitle: (roomTitle: string) => `Реакция в «${roomTitle}»`,
  messageReactionBody: (name: string, emoji: string, preview: string) =>
    `${name} отреагировал(а) ${emoji} на «${preview}»`,
  messageReactionBodyFallback: (name: string, emoji: string) =>
    `${name} отреагировал(а) ${emoji} на ваше сообщение`,
  chatReactionBody: (name: string, emoji: string, preview: string) =>
    `${name} отреагировал(а) ${emoji}: «${preview}»`,
  chatReactionBodyFallback: (name: string, emoji: string) =>
    `${name} отреагировал(а) ${emoji} на ваше сообщение`,
  friendRequestTitle: "Заявка в друзья",
  friendRequestBody: (name: string) => `${name} хочет добавить вас в друзья`,
  friendAcceptedTitle: "Заявка принята",
  friendAcceptedBody: (name: string) => `${name} принял(а) вашу заявку в друзья`,
  messageTitle: (name: string) => `Сообщение от ${name}`,
  tripJoinTitle: "Новый участник поездки",
  tripJoinBody: (name: string, tripTitle: string) => `${name} присоединился к «${tripTitle}»`,
  tripInviteTitle: "Приглашение в поездку",
  tripInviteBody: (name: string, tripTitle: string) =>
    `${name} добавил(а) вас в «${tripTitle}» — открыт чат группы`,
  eventRegistrationTitle: "Регистрация на событие",
  eventRegistrationBody: (name: string, eventTitle: string) =>
    `${name} записался на «${eventTitle}»`,
  groupJoinTitle: "Новый участник группы",
  groupJoinBody: (name: string, roomTitle: string) => `${name} вступил в «${roomTitle}»`,
  messagePinnedTitle: (roomTitle: string) => `Закреплено в «${roomTitle}»`,
  messagePinnedBody: (name: string, body: string) => `${name}: ${body}`,
  actorsTwo: (first: string, second: string) => `${first} и ${second}`,
  actorsOneAndAnother: (name: string) => `${name} и ещё один`,
  actorsAndMore: (name: string, count: number) => `${name} и ещё ${count}`,
} as const;

export type NotificationCopy = typeof EN;
