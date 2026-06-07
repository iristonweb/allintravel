/** Shared navigation config — single source of truth for app shell nav */

import type { LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; badge?: string };

export type SidebarNavItem = NavItem & { icon?: LucideIcon };

export type SidebarNavSubItem = { href: string; label: string };

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavSubItem[];
};

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

/** Sidebar: основные разделы */
export const sidebarPrimaryNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/trips", label: "Поездки" },
  { href: "/social-feed", label: "Лента" },
  { href: "/friends", label: "Друзья" },
];

/** Sidebar: чаты — раскрывающаяся группа */
export const sidebarChatsNav: SidebarNavGroup = {
  label: "Чаты",
  items: [
    { href: "/chat", label: "Мои группы" },
    { href: "/chat?tab=unread", label: "Непрочит. группы" },
    { href: "/chat?tab=mine", label: "Участник" },
    { href: "/messages", label: "Личные" },
    { href: "/messages?tab=unread", label: "Непрочит. личные" },
  ],
};

/** Sidebar: каталог и контент */
export const sidebarDiscoverNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/blog", label: "Блог" },
  { href: "/profile/music", label: "Моя музыка" },
];

/** Sidebar: AIT — дублируется иконкой кошелька в шапке */
export const sidebarExtraNav: NavItem[] = [];

/** Ссылки аккаунта — только на странице профиля и аватар в шапке */
export const sidebarAccountNav: SidebarNavItem[] = [];

/** Полное меню для мобильного drawer в шапке */
export const authenticatedMenuNav: NavItem[] = [
  ...sidebarPrimaryNav,
  ...sidebarChatsNav.items,
  ...sidebarDiscoverNav,
  ...sidebarExtraNav,
  ...sidebarAccountNav.map(({ href, label }) => ({ href, label })),
];

export const mobileMainNav: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/trips", label: "" },
  { href: "/chat", label: "Чаты" },
];

export const mobileEcosystemNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/social-feed", label: "Лента" },
  { href: "/friends", label: "Друзья" },
  { href: "/wallet", label: "AIT Hub" },
  { href: "/profile/music", label: "Музыка" },
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

/** Match sidebar href including optional ?tab= query */
export function isSidebarNavHrefActive(
  href: string,
  pathname: string,
  search: string,
): boolean {
  const [path, queryString] = href.split("?");
  const pathMatch =
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
  if (!pathMatch) return false;
  if (!queryString) {
    const params = new URLSearchParams(search);
    if (path === "/chat") {
      const tab = params.get("tab");
      return !tab || tab === "all";
    }
    if (path === "/messages") {
      const tab = params.get("tab");
      return !tab || tab === "personal";
    }
    return true;
  }
  const expected = new URLSearchParams(queryString);
  const actual = new URLSearchParams(search);
  let match = true;
  expected.forEach((value, key) => {
    if (actual.get(key) !== value) match = false;
  });
  return match;
}
