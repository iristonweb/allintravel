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

export const centerNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/social-feed", label: "Сообщество" },
  { href: "/trips", label: "Поездки" },
  { href: "/blog", label: "Блог" },
];

export const moreNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/wallet", label: "Кошелёк (Demo)" },
  { href: "/friends", label: "Друзья" },
  { href: "/messages", label: "Чаты" },
  { href: "/chat", label: "Комнаты" },
];

export const sidebarMainNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/trips", label: "Поездки" },
  { href: "/social-feed", label: "Сообщество" },
  { href: "/friends", label: "Друзья" },
  { href: "/messages", label: "Сообщения" },
  { href: "/profile", label: "Профиль" },
];

export const sidebarServiceNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/blog", label: "Блог" },
  { href: "/wallet", label: "Кошелёк" },
  { href: "/chat", label: "Комнаты" },
];

export const mobileMainNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/trips", label: "" },
  { href: "/messages", label: "Чаты" },
];

export const mobileEcosystemNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/blog", label: "Блог" },
  { href: "/wallet", label: "Кошелёк" },
  { href: "/social-feed", label: "Сообщество" },
  { href: "/friends", label: "Друзья" },
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
