import type { LucideIcon } from "lucide-react";
import { BookOpen, Calendar, Hash, MapPin, MessageCircle, Music, Rss, Users } from "lucide-react";

export type ProfileHubLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  badge?: string;
};

export const profileHubLinks: ProfileHubLink[] = [
  { href: "/social-feed", label: "Моя лента", icon: Rss, desc: "Посты и сообщество" },
  { href: "/blog", label: "Блог", icon: BookOpen, desc: "Публичные статьи" },
  { href: "/events", label: "События", icon: Calendar, desc: "Мои и ближайшие события" },
  { href: "/profile/friends", label: "Друзья", icon: Users, desc: "По направлениям и поиск" },
  { href: "/profile/music", label: "Моя музыка", icon: Music, desc: "Загрузки и фоновый плеер" },
  { href: "/chat?tab=personal", label: "Личные", icon: MessageCircle, desc: "Личные чаты" },
  { href: "/chat", label: "Мои группы", icon: Hash, desc: "Группы и обсуждения" },
];

export const profileMapLink: ProfileHubLink = {
  href: "/map",
  label: "Карта",
  icon: MapPin,
  desc: "Маршруты и места",
};

export const profileHubLinksWithMap: ProfileHubLink[] = [...profileHubLinks, profileMapLink];
