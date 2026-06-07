/** Shared navigation config — single source of truth for app shell nav */

import type { LucideIcon } from "lucide-react";
import { Settings, User, PenLine } from "lucide-react";

export type NavItem = { href: string; label: string; badge?: string };

export type SidebarNavItem = NavItem & { icon?: LucideIcon };

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
  { href: "/messages", label: "Сообщения" },
];

/** Sidebar: каталог и контент */
export const sidebarDiscoverNav: NavItem[] = [
  { href: "/places", label: "Места" },
  { href: "/events", label: "События" },
  { href: "/blog", label: "Блог" },
  { href: "/chat", label: "Чаты и группы" },
  { href: "/profile/music", label: "Моя музыка" },
];

/** Sidebar: AIT */
export const sidebarExtraNav: NavItem[] = [{ href: "/wallet", label: "AIT Hub", badge: "AIT" }];

/** Sidebar: аккаунт (без дублирования ссылок из ленты) */
export const sidebarAccountNav: SidebarNavItem[] = [
  { href: "/profile", label: "Мой профиль", icon: User },
  { href: "/profile/edit", label: "Редактировать", icon: PenLine },
  { href: "/profile/settings", label: "Настройки", icon: Settings },
];

/** Полное меню для мобильного drawer в шапке */
export const authenticatedMenuNav: NavItem[] = [
  ...sidebarPrimaryNav,
  ...sidebarDiscoverNav,
  ...sidebarExtraNav,
  ...sidebarAccountNav.map(({ href, label }) => ({ href, label })),
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
  { href: "/social-feed", label: "Лента" },
  { href: "/friends", label: "Друзья" },
  { href: "/chat", label: "Группа" },
  { href: "/wallet", label: "AIT Hub" },
  { href: "/profile/music", label: "Музыка" },
  { href: "/profile", label: "Профиль" },
  { href: "/profile/settings", label: "Настройки" },
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
