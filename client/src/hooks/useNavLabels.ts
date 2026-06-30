import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { NavItem } from "@/lib/nav-config";
import {
  NAV_GROUPS,
  MOBILE_MAIN_NAV_HREFS,
  MOBILE_ECOSYSTEM_HREFS,
  type NavGroup,
  type NavGroupItem,
} from "@/lib/nav-groups";

export type LabeledNavGroup = {
  id: NavGroup["id"];
  label: string;
  items: Array<NavGroupItem & { label: string }>;
};

export function useNavLabels() {
  const { t } = useTranslation();

  return useMemo(() => {
    const navGroups: LabeledNavGroup[] = NAV_GROUPS.map((group) => ({
      id: group.id,
      label: t(group.labelKey),
      items: group.items.map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    }));

    const flatNav = navGroups.flatMap((g) => g.items);

    const sidebarPrimaryNav = flatNav
      .filter((item) => !["/places", "/events", "/passport"].includes(item.href))
      .map(({ href, label }) => ({ href, label }) satisfies NavItem);

    const sidebarDiscoverNav = flatNav
      .filter((item) => ["/places", "/events"].includes(item.href))
      .map(({ href, label }) => ({ href, label }) satisfies NavItem);

    const mobileMainNav: NavItem[] = MOBILE_MAIN_NAV_HREFS.map((href) => {
      const item = flatNav.find((i) => i.href === href);
      return {
        href,
        label: href === "/trips" ? "" : (item?.label ?? ""),
      };
    });

    const mobileEcosystemNav: NavItem[] = MOBILE_ECOSYSTEM_HREFS.map((href) => {
      const item = flatNav.find((i) => i.href === href);
      const fallbackLabels: Record<string, string> = {
        "/wallet": t("nav.wallet"),
        "/profile/music": t("nav.music"),
      };
      return {
        href,
        label: item?.label ?? fallbackLabels[href] ?? href,
      };
    });

    return {
      navGroups,
      guestAnchors: [
        { href: "#explore", label: t("nav.explore") },
        { href: "#community", label: t("nav.community") },
        { href: "#apps", label: t("nav.apps") },
      ] satisfies NavItem[],
      footerAnchors: [
        { href: "#explore", label: t("nav.mapRoutes") },
        { href: "#community", label: t("nav.feed") },
        { href: "/nomad-hubs", label: t("nav.nomadHubs") },
      ] satisfies NavItem[],
      sidebarPrimaryNav,
      sidebarDiscoverNav,
      mobileMainNav,
      mobileEcosystemNav,
      pageTitles: {
        "/": t("nav.home"),
        "/map": t("nav.map"),
        "/trips": t("nav.trips"),
        "/social-feed": t("nav.communityHub"),
        "/friends": t("nav.friends"),
        "/profile": t("nav.profile"),
        "/profile/music": t("nav.music"),
        "/music": t("nav.music"),
        "/places": t("nav.places"),
        "/events": t("nav.events"),
        "/wallet": t("nav.wallet"),
        "/chat": t("nav.chat"),
        "/passport": t("nav.passport"),
        "/notifications": t("nav.notifications"),
        "/admin": t("nav.admin"),
        "/nomad-hubs": t("nav.nomadHubs"),
        "/creators": t("nav.creators"),
        "/launch": t("nav.launch"),
      } as Record<string, string>,
    };
  }, [t]);
}
