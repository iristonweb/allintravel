/** Shared navigation config — anchor scroll helpers and types */

export type NavItem = { href: string; label: string; badge?: string };
export type SidebarNavItem = NavItem & { icon?: import("lucide-react").LucideIcon };

export { NAV_GROUPS } from "./nav-groups";

export function anchorToRoute(hash: string): string {
  const h = hash.startsWith("#") ? hash : `#${hash}`;
  return `/${h}`;
}

export function scrollToAnchor(hash: string): void {
  const id = hash.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
