import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  ru: {
    translation: {
      appName: "All In Travel",
      appTagline: "Explore · Plan · Share",
      appDescription:
        "Единая экосистема для путешественников: карта, планировщик, сообщество и чаты.",
      nav: {
        home: "Главная",
        places: "Места",
        trips: "Поездки",
        feed: "Лента",
        events: "События",
        login: "Войти",
      },
      verified: "Проверен",
      chat: {
        joinGate: {
          title: "Вступите в группу, чтобы читать и отправлять сообщения — как в Telegram.",
          joinButton: "Вступить в группу",
          joinedToast: "Вы вступили в «{{title}}»",
          joinedToastFallback: "Вы вступили в группу",
          joinError: "Не удалось вступить",
          joinErrorGroup: "Не удалось вступить в группу",
          memberCount: "{{count}} участников",
        },
        searchDialog: {
          title: "Поиск",
          description: "Группы как в Telegram · места на карте",
          tabs: { groups: "Группы", places: "Места" },
          placeholder: "Название группы (от 2 символов)…",
          hint: "Введите название — покажем похожие публичные группы, в которых вы ещё не состоите.",
          empty: "Похожих групп не найдено.",
          memberCount: "{{count}} участн.",
          join: "Вступить",
          placesHint: "Поиск отелей, ресторанов и мест на интерактивной карте.",
          openMap: "Открыть карту",
        },
        legacy: {
          badge: "Офиц.",
          joinHint: "Официальный канал — напишите сообщение, чтобы присоединиться к обсуждению.",
        },
        sidebar: {
          searchPlaceholder: "Поиск групп",
        },
        discover: {
          header: "Найти публичные группы",
          empty: "Похожих групп не найдено. Попробуйте другое название.",
          memberCount: "{{count}} участн.",
          join: "Вступить",
        },
        hero: {
          groupLabel: "Группа",
          groupPlaceholder: "Название группы…",
        },
      },
      notifications: {
        new: "Новые",
        empty: "Нет новых уведомлений",
        viewAll: "Все уведомления",
        friendRequests: "Заявки в друзья",
        readAll: "Прочитать все",
        filters: {
          all: "Все",
          social: "Социальное",
          messages: "Сообщения",
        },
        buckets: {
          today: "Сегодня",
          thisWeek: "На этой неделе",
          earlier: "Раньше",
        },
        page: {
          title: "Уведомления",
          description: "Лайки, комментарии, сообщения и заявки в друзья",
        },
        someone: "Кто-то",
        postLike: {
          title: "Оценка публикации",
          verbSingle: "оценила вашу публикацию",
          verbPlural: "оценили вашу публикацию",
          summarySingle: "оценила вашу публикацию",
        },
        postComment: {
          title: "Комментарий к публикации",
          verbSingle: "прокомментировала публикацию",
          verbPlural: "прокомментировали публикацию",
          summarySingle: "прокомментировала публикацию",
        },
        defaultVerbSingle: "отправил(а) уведомление",
        defaultVerbPlural: "отправили уведомление",
        messageSummary: "написала вам",
      },
    },
  },
  en: {
    translation: {
      appName: "All In Travel",
      appTagline: "Explore · Plan · Share",
      appDescription: "A unified ecosystem for travelers: map, planner, community, and chats.",
      nav: {
        home: "Home",
        places: "Places",
        trips: "Trips",
        feed: "Feed",
        events: "Events",
        login: "Sign in",
      },
      verified: "Verified",
      chat: {
        joinGate: {
          title: "Join the group to read and send messages — like Telegram.",
          joinButton: "Join group",
          joinedToast: "You joined «{{title}}»",
          joinedToastFallback: "You joined the group",
          joinError: "Could not join",
          joinErrorGroup: "Could not join the group",
          memberCount: "{{count}} members",
        },
        searchDialog: {
          title: "Search",
          description: "Groups like Telegram · places on the map",
          tabs: { groups: "Groups", places: "Places" },
          placeholder: "Group name (2+ characters)…",
          hint: "Enter a name — we'll show similar public groups you haven't joined yet.",
          empty: "No matching groups found.",
          memberCount: "{{count}} members",
          join: "Join",
          placesHint: "Search hotels, restaurants, and places on the interactive map.",
          openMap: "Open map",
        },
        legacy: {
          badge: "Official",
          joinHint: "Official channel — send a message to join the discussion.",
        },
        sidebar: {
          searchPlaceholder: "Search groups",
        },
        discover: {
          header: "Find public groups",
          empty: "No matching groups found. Try another name.",
          memberCount: "{{count}} members",
          join: "Join",
        },
        hero: {
          groupLabel: "Group",
          groupPlaceholder: "Group name…",
        },
      },
      notifications: {
        new: "New",
        empty: "No new notifications",
        viewAll: "All notifications",
        friendRequests: "Friend requests",
        readAll: "Mark all read",
        filters: {
          all: "All",
          social: "Social",
          messages: "Messages",
        },
        buckets: {
          today: "Today",
          thisWeek: "This week",
          earlier: "Earlier",
        },
        page: {
          title: "Notifications",
          description: "Likes, comments, messages, and friend requests",
        },
        someone: "Someone",
        postLike: {
          title: "Post liked",
          verbSingle: "liked your post",
          verbPlural: "liked your post",
          summarySingle: "liked your post",
        },
        postComment: {
          title: "Post comment",
          verbSingle: "commented on your post",
          verbPlural: "commented on your post",
          summarySingle: "commented on your post",
        },
        defaultVerbSingle: "sent a notification",
        defaultVerbPlural: "sent notifications",
        messageSummary: "messaged you",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ru",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export default i18n;
