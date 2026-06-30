/** Shared navigation config — re-exports from nav-groups for backward compatibility */

import {
  NAV_GROUPS,
  flattenNavGroups,
  MOBILE_MAIN_NAV_HREFS,
  MOBILE_ECOSYSTEM_HREFS,
} from "./nav-groups";

export type NavItem = { href: string; label: string; badge?: string };
export type SidebarNavItem = NavItem & { icon?: import("lucide-react").LucideIcon };

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

/** @deprecated Use NAV_GROUPS via useNavLabels — flat list for legacy callers */
export const sidebarPrimaryNav: NavItem[] = flattenNavGroups(NAV_GROUPS)
  .filter((item) => !["/places", "/events", "/passport"].includes(item.href))
  .map(({ href }) => ({ href, label: "" }));

/** @deprecated Use NAV_GROUPS via useNavLabels */
export const sidebarDiscoverNav: NavItem[] = [];

export const sidebarExtraNav: NavItem[] = [];
export const sidebarAccountNav: SidebarNavItem[] = [];

export const authenticatedMenuNav: NavItem[] = flattenNavGroups(NAV_GROUPS).map(({ href }) => ({
  href,
  label: "",
}));

export const mobileMainNav: NavItem[] = MOBILE_MAIN_NAV_HREFS.map((href) => ({
  href,
  label: href === "/trips" ? "" : "",
}));

export const mobileEcosystemNav: NavItem[] = MOBILE_ECOSYSTEM_HREFS.map((href) => ({
  href,
  label: "",
}));

export { NAV_GROUPS };

export function anchorToRoute(hash: string): string {
  const h = hash.startsWith("#") ? hash : `#${hash}`;
  return `/${h}`;
}

export function scrollToAnchor(hash: string): void {
  const id = hash.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
