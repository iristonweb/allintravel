import type { NotificationType } from "@shared/notification-types";
import i18n from "@/i18n";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Pin,
  Sparkles,
  Calendar,
  Plane,
  type LucideIcon,
} from "lucide-react";

export type NotificationVisual = {
  icon: LucideIcon;
  emoji?: string;
  accentClass: string;
};

export function notificationVisual(type: NotificationType): NotificationVisual {
  switch (type) {
    case "post_like":
      return { icon: Heart, emoji: "❤️", accentClass: "from-rose-500/80 to-pink-600/80" };
    case "post_comment":
      return { icon: MessageCircle, accentClass: "from-ait-purple/80 to-violet-600/80" };
    case "message":
    case "message_reaction":
      return { icon: MessageCircle, accentClass: "from-sky-500/80 to-blue-600/80" };
    case "chat_reaction":
      return { icon: MessageCircle, accentClass: "from-cyan-500/80 to-teal-600/80" };
    case "message_pinned":
      return { icon: Pin, accentClass: "from-amber-500/80 to-orange-600/80" };
    case "friend_request":
    case "friend_accepted":
    case "friend_rejected":
      return { icon: UserPlus, accentClass: "from-ait-purple/80 to-ait-orange/80" };
    case "group_invite":
    case "group_join":
      return { icon: Users, accentClass: "from-indigo-500/80 to-purple-600/80" };
    case "trip_join":
      return { icon: Plane, accentClass: "from-ait-orange/80 to-amber-600/80" };
    case "event_registration":
      return { icon: Calendar, accentClass: "from-emerald-500/80 to-green-600/80" };
    default:
      return { icon: Sparkles, accentClass: "from-ait-purple/80 to-ait-orange/80" };
  }
}

export function groupNotificationsByDay(
  items: { createdAt: string | null }[],
): { label: string; items: typeof items }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const buckets = new Map<string, typeof items>();
  const order: string[] = [];

  for (const item of items) {
    const t = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    let label = i18n.t("notifications.buckets.earlier");
    if (t >= startOfToday) label = i18n.t("notifications.buckets.today");
    else if (t >= startOfWeek) label = i18n.t("notifications.buckets.thisWeek");

    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(item);
  }

  return order.map((label) => ({ label, items: buckets.get(label)! }));
}
