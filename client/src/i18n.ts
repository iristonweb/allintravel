import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  ru: {
    translation: {
      appName: "All In Travel",
      nav: {
        home: "Главная",
        places: "Места",
        trips: "Поездки",
        feed: "Лента",
        events: "События",
        login: "Войти",
      },
      verified: "Проверен",
    },
  },
  en: {
    translation: {
      appName: "All In Travel",
      nav: {
        home: "Home",
        places: "Places",
        trips: "Trips",
        feed: "Feed",
        events: "Events",
        login: "Sign in",
      },
      verified: "Verified",
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
