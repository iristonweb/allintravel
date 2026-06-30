import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Calendar,
  Hash,
  MapPin,
  MessageCircle,
  Music,
  Rss,
  Users,
} from "lucide-react";

export type ProfileHubLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  badge?: string;
};

type ProfileHubLinkDef = {
  href: string;
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  badge?: string;
};

const PROFILE_HUB_LINK_DEFS: ProfileHubLinkDef[] = [
  {
    href: "/social-feed",
    labelKey: "profileHub.myFeed",
    descKey: "profileHub.myFeedDesc",
    icon: Rss,
  },
  {
    href: "/social-feed?format=public",
    labelKey: "profileHub.public",
    descKey: "profileHub.publicDesc",
    icon: BookOpen,
  },
  {
    href: "/events",
    labelKey: "profileHub.events",
    descKey: "profileHub.eventsDesc",
    icon: Calendar,
  },
  {
    href: "/profile/friends",
    labelKey: "profileHub.friends",
    descKey: "profileHub.friendsDesc",
    icon: Users,
  },
  {
    href: "/profile/music",
    labelKey: "profileHub.music",
    descKey: "profileHub.musicDesc",
    icon: Music,
  },
  {
    href: "/chat?tab=unread",
    labelKey: "profileHub.unread",
    descKey: "profileHub.unreadDesc",
    icon: Bell,
  },
  {
    href: "/chat?tab=personal",
    labelKey: "profileHub.personal",
    descKey: "profileHub.personalDesc",
    icon: MessageCircle,
  },
  { href: "/chat", labelKey: "profileHub.groups", descKey: "profileHub.groupsDesc", icon: Hash },
];

const PROFILE_MAP_LINK_DEF: ProfileHubLinkDef = {
  href: "/map",
  labelKey: "profileHub.map",
  descKey: "profileHub.mapDesc",
  icon: MapPin,
};

function translateHubLinks(
  defs: ProfileHubLinkDef[],
  t: (key: string) => string,
): ProfileHubLink[] {
  return defs.map(({ href, labelKey, descKey, icon, badge }) => ({
    href,
    label: t(labelKey),
    desc: t(descKey),
    icon,
    badge,
  }));
}

export function useProfileHubLinks() {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      links: translateHubLinks(PROFILE_HUB_LINK_DEFS, t),
      linksWithMap: translateHubLinks([...PROFILE_HUB_LINK_DEFS, PROFILE_MAP_LINK_DEF], t),
      mapLink: translateHubLinks([PROFILE_MAP_LINK_DEF], t)[0],
    }),
    [t],
  );
}
