/** Single source of truth for EXPLORE · PLAN · SHARE navigation groups */

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookMarked,
  Calendar,
  Compass,
  Film,
  Globe,
  Heart,
  Home,
  Map,
  MapPin,
  MessageSquare,
  Settings,
  Sparkles,
  Stamp,
  User,
  Users,
  Rss,
} from "lucide-react";

export type NavGroupId = "explore" | "plan" | "share";

export type NavGroupItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badgeKey?: string;
};

export type NavGroup = {
  id: NavGroupId;
  labelKey: string;
  items: NavGroupItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "explore",
    labelKey: "nav.groups.explore",
    items: [
      { href: "/", labelKey: "nav.home", icon: Home },
      { href: "/map", labelKey: "nav.map", icon: Map },
      { href: "/places", labelKey: "nav.places", icon: MapPin },
      { href: "/events", labelKey: "nav.events", icon: Sparkles },
    ],
  },
  {
    id: "plan",
    labelKey: "nav.groups.plan",
    items: [
      { href: "/trips", labelKey: "nav.trips", icon: Calendar },
      { href: "/passport", labelKey: "nav.passport", icon: Stamp },
    ],
  },
  {
    id: "share",
    labelKey: "nav.groups.share",
    items: [
      { href: "/social-feed", labelKey: "nav.feed", icon: Rss },
      { href: "/friends", labelKey: "nav.friends", icon: Users },
      { href: "/chat", labelKey: "nav.chat", icon: MessageSquare },
    ],
  },
];

/** Expanded community hub navigation (reference mockup). */
export const COMMUNITY_SIDEBAR_ITEMS: NavGroupItem[] = [
  { href: "/social-feed", labelKey: "nav.communityHub", icon: Users },
  { href: "/social-feed", labelKey: "social.formats.feed", icon: Rss },
  { href: "/social-feed?format=stories", labelKey: "social.formats.stories", icon: BookMarked },
  { href: "/social-feed?format=reels", labelKey: "social.formats.reels", icon: Film },
  { href: "/social-feed?format=journals", labelKey: "social.formats.journals", icon: Compass },
  { href: "/social-feed?format=public", labelKey: "nav.guides", icon: Globe },
  { href: "/trips", labelKey: "nav.routes", icon: Calendar },
  { href: "/places", labelKey: "nav.places", icon: MapPin },
  { href: "/map", labelKey: "nav.map", icon: Map },
  { href: "/trips?ai=1", labelKey: "nav.aiPlanner", icon: Sparkles, badgeKey: "nav.badges.new" },
  { href: "/profile/edit?tab=favorites", labelKey: "nav.favorites", icon: Heart },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/profile", labelKey: "nav.profile", icon: User },
  { href: "/profile/settings", labelKey: "nav.settings", icon: Settings },
];

export const MOBILE_MAIN_NAV_HREFS = ["/", "/map", "/trips", "/social-feed"] as const;

export const MOBILE_ECOSYSTEM_HREFS = [
  "/places",
  "/events",
  "/friends",
  "/chat",
  "/passport",
  "/wallet",
  "/profile/music",
] as const;

export function flattenNavGroups(groups: NavGroup[]): NavGroupItem[] {
  return groups.flatMap((g) => g.items);
}

export function navItemByHref(href: string): NavGroupItem | undefined {
  return flattenNavGroups(NAV_GROUPS).find((item) => item.href === href);
}

export function isNavActive(location: string, href: string): boolean {
  if (href === "/") return location === "/";
  if (href === "/profile") return location === "/profile";
  if (href === "/friends")
    return location === "/friends" || location.startsWith("/profile/friends");
  if (href === "/chat") return location.startsWith("/chat") || location.startsWith("/messages");
  if (href === "/social-feed") {
    return location === "/social-feed" || location.startsWith("/post/");
  }
  return location === href || location.startsWith(`${href}/`);
}

/** Match nav href including query (e.g. `/social-feed?format=reels`). */
export function matchNavHref(pathname: string, search: string, href: string): boolean {
  const [hrefPath, hrefQuery] = href.split("?");
  const pathOk = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  if (!pathOk) return false;

  const locParams = new URLSearchParams(search.replace(/^\?/, ""));

  if (!hrefQuery) {
    if (hrefPath === "/social-feed") {
      const format = locParams.get("format");
      return pathname === "/social-feed" && (!format || format === "feed");
    }
    if (hrefPath === "/trips") {
      return pathname === "/trips" && !locParams.get("ai");
    }
    if (hrefPath === "/profile/edit") {
      return pathname === "/profile/edit" && !locParams.get("tab");
    }
    return pathname === hrefPath;
  }

  const hrefParams = new URLSearchParams(hrefQuery);
  const keys = Array.from(hrefParams.keys());
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]!;
    if (locParams.get(key) !== hrefParams.get(key)) return false;
  }
  return pathname === hrefPath;
}

export function isCommunityHubRoute(pathname: string): boolean {
  return pathname === "/social-feed" || pathname.startsWith("/post/");
}
