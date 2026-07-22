/** Brand copy — used in HTML meta, manifest, and UI */

export const SITE_NAME = "All In Travel";

export const SITE_TAGLINE = "Explore · Plan · Share";

const SITE_COPY = {
  en: {
    description:
      "All In Travel — a unified ecosystem for travelers: interactive world map, trip planner, community, chats, and the best places on the planet.",
    descriptionShort: "Map, planner, and traveler community in one premium app.",
  },
  ru: {
    description:
      "All In Travel — единая экосистема для путешественников: интерактивная карта мира, планировщик маршрутов, сообщество, чаты и лучшие места на планете.",
    descriptionShort:
      "Карта, планировщик и сообщество путешественников в одном премиальном приложении.",
  },
} as const;

export type SiteLocale = keyof typeof SITE_COPY;

export function resolveSiteLocale(raw?: string | null): SiteLocale {
  return raw?.startsWith("en") ? "en" : "ru";
}

export function getSiteMeta(locale?: string | null) {
  const lang = resolveSiteLocale(locale);
  const copy = SITE_COPY[lang];
  return {
    name: SITE_NAME,
    tagline: SITE_TAGLINE,
    description: copy.description,
    descriptionShort: copy.descriptionShort,
  };
}

/** @deprecated Prefer getSiteMeta(locale).description — defaults to Russian for backwards compat */
export const SITE_DESCRIPTION = SITE_COPY.ru.description;
/** @deprecated Prefer getSiteMeta(locale).descriptionShort */
export const SITE_DESCRIPTION_SHORT = SITE_COPY.ru.descriptionShort;

/** Opaque square asset — favicon, OG, manifest only */
export const BRAND_LOGO_SRC = "/brand/logo-ait.png";
/** Transparent full wordmark (icon + title + tagline) */
export const BRAND_WORDMARK_SRC = "/brand/logo-wordmark-transparent.png";
/** Transparent icon mark for nav / compact slots */
export const BRAND_NAV_MARK_SRC = "/brand/logo-mark.png";
/** @deprecated use BRAND_NAV_MARK_SRC — kept for imports */
export const BRAND_ICON_SRC = "/brand/logo-mark.png";

/** App store links — empty string = show "Скоро" */
export const APP_STORE_URL = "";
export const PLAY_STORE_URL = "";
export const WINDOWS_STORE_URL = "";
