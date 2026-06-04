/** Shared navigation config — single source of truth for app shell nav */

export type NavItem = { href: string; label: string };

export const guestAnchors: NavItem[] = [
  { href: "#explore", label: "Исследовать" },
  { href: "#community", label: "Сообщество" },
  { href: "#apps", label: "Приложения" },
];

export const footerAnchors: NavItem[] = [
  { href: "#explore", label: "Карта и маршруты" },
  { href: "#community", label: "Лента" },
  { href: "#apps", label: "Приложения" },
];

/** Sidebar + mobile drawer: основные разделы (ежедневное использование) */
export const sidebarPrimaryNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/trips", label: "Поездки" },
  { href: "/messages", label: "Сообщения" },
  { href: "/profile", label: "Профиль" },
];

/** Sidebar: каталог и контент */
export const sidebarDiscoverNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/blog", label: "Блог" },
  { href: "/social-feed", label: "Сообщество" },
  { href: "/chat", label: "Комнаты" },
];

/** Sidebar: доп. инструменты */
export const sidebarExtraNav: NavItem[] = [];

/** Полное меню для мобильного drawer в шапке (< md, когда сайдбар скрыт) */
export const authenticatedMenuNav: NavItem[] = [
  ...sidebarPrimaryNav,
  ...sidebarDiscoverNav,
  ...sidebarExtraNav,
];

/** @deprecated Use sidebarPrimaryNav — kept for imports during migration */
export const sidebarMainNav = sidebarPrimaryNav;

/** @deprecated Use sidebarDiscoverNav + sidebarExtraNav */
export const sidebarServiceNav: NavItem[] = [...sidebarDiscoverNav, ...sidebarExtraNav];

/** @deprecated Header no longer duplicates sidebar; use authenticatedMenuNav on mobile */
export const centerNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/social-feed", label: "Сообщество" },
  { href: "/trips", label: "Поездки" },
  { href: "/blog", label: "Блог" },
];

/** @deprecated All items live in sidebar; mobile uses authenticatedMenuNav */
export const moreNav: NavItem[] = [...sidebarDiscoverNav, ...sidebarExtraNav, ...sidebarPrimaryNav.filter(
  (i) => ["/friends", "/messages"].includes(i.href),
)];

export const mobileMainNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/trips", label: "" },
  { href: "/messages", label: "Чаты" },
];

export const mobileEcosystemNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/social-feed", label: "Сообщество" },
  { href: "/chat", label: "Комнаты" },
  { href: "/profile", label: "Профиль" },
];

/** Landing hash → full path for guest pages without section IDs */
export function anchorToRoute(hash: string): string {
  const h = hash.startsWith("#") ? hash : `#${hash}`;
  return `/${h}`;
}

export function scrollToAnchor(hash: string): void {
  const id = hash.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
