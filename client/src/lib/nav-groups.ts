/** Single source of truth for EXPLORE · PLAN · SHARE navigation groups */

import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Home,
  Map,
  MapPin,
  MessageSquare,
  Sparkles,
  Stamp,
  Users,
  Rss,
} from "lucide-react";

export type NavGroupId = "explore" | "plan" | "share";

export type NavGroupItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
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
  if (href === "/social-feed") return location === "/social-feed" || location.startsWith("/post/");
  return location === href || location.startsWith(`${href}/`);
}
