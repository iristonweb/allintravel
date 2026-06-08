import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { NavItem } from "@/lib/nav-config";

export function useNavLabels() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
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
      sidebarPrimaryNav: [
        { href: "/", label: t("nav.home") },
        { href: "/map", label: t("nav.map") },
        { href: "/trips", label: t("nav.trips") },
        { href: "/social-feed", label: t("nav.feed") },
        { href: "/friends", label: t("nav.friends") },
        { href: "/chat", label: t("nav.chat") },
      ] satisfies NavItem[],
      sidebarDiscoverNav: [
        { href: "/places", label: t("nav.places") },
        { href: "/events", label: t("nav.events") },
        { href: "/blog", label: t("nav.blog") },
        { href: "/passport", label: t("nav.passport") },
        { href: "/profile/music", label: t("nav.music") },
      ] satisfies NavItem[],
      mobileMainNav: [
        { href: "/", label: t("nav.home") },
        { href: "/map", label: t("nav.map") },
        { href: "/trips", label: "" },
        { href: "/chat", label: t("nav.chat") },
      ] satisfies NavItem[],
      mobileEcosystemNav: [
        { href: "/places", label: t("nav.places") },
        { href: "/events", label: t("nav.events") },
        { href: "/social-feed", label: t("nav.feed") },
        { href: "/friends", label: t("nav.friends") },
        { href: "/passport", label: t("nav.passport") },
        { href: "/wallet", label: t("nav.wallet") },
        { href: "/profile/music", label: t("nav.music") },
      ] satisfies NavItem[],
      pageTitles: {
        "/": t("nav.home"),
        "/map": t("nav.map"),
        "/trips": t("nav.trips"),
        "/social-feed": t("nav.feed"),
        "/friends": t("nav.friends"),
        "/profile": t("nav.profile"),
        "/profile/music": t("nav.music"),
        "/music": t("nav.music"),
        "/places": t("nav.places"),
        "/events": t("nav.events"),
        "/blog": t("nav.blog"),
        "/wallet": t("nav.wallet"),
        "/chat": t("nav.chat"),
        "/passport": t("nav.passport"),
        "/notifications": t("nav.notifications"),
        "/admin": t("nav.admin"),
        "/nomad-hubs": t("nav.nomadHubs"),
        "/creators": t("nav.creators"),
        "/launch": t("nav.launch"),
      } as Record<string, string>,
    }),
    [t],
  );
}
