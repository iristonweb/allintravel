import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { AppNotification } from "@shared/notification-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { notificationVisual } from "@/lib/notification-ui";

type NotificationRowProps = {
  item: AppNotification;
  onActivate?: (item: AppNotification) => void;
  compact?: boolean;
};

function notificationSummary(item: AppNotification, actorLabel: string): string {
  switch (item.type) {
    case "post_like":
      return `${actorLabel} оценила вашу публикацию`;
    case "post_comment":
      return `${actorLabel} прокомментировала публикацию`;
    case "message_reaction":
    case "chat_reaction":
      return item.title;
    case "message":
      return `${actorLabel} написала вам`;
    default:
      return item.title;
  }
}

export default function NotificationRow({ item, onActivate, compact }: NotificationRowProps) {
  const visual = notificationVisual(item.type);
  const Icon = visual.icon;
  const actor = item.actor;
  const actorLabel = actor ? getUserDisplayLabel(actor) : "Кто-то";
  const initial = actor ? getUserInitial(actor) : "?";
  const summary = notificationSummary(item, actorLabel);

  const inner = (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-transparent p-3 transition-colors",
        "hover:bg-white/[0.06] hover:border-white/10",
        !item.isRead && "bg-white/[0.04] border-white/8",
        compact && "p-2.5 gap-2.5",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className={cn("border-2 border-white/15", compact ? "h-10 w-10" : "h-11 w-11")}>
          <AvatarImage src={resolveMediaUrl(actor?.profileImageUrl)} />
          <AvatarFallback className="bg-gradient-to-br from-ait-purple to-ait-orange text-xs text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full",
            "bg-gradient-to-br text-[10px] shadow-md ring-2 ring-[#050816]",
            visual.accentClass,
          )}
          aria-hidden
        >
          {visual.emoji ? (
            <span className="text-[11px] leading-none">{visual.emoji}</span>
          ) : (
            <Icon className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            !item.isRead ? "text-white" : "text-slate-200",
          )}
        >
          {summary}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.body}</p>
        {item.createdAt && (
          <p className="text-[10px] text-muted-foreground/80 mt-1.5">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ru })}
          </p>
        )}
      </div>

      {!item.isRead && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ait-purple shadow-[0_0_8px_rgba(139,92,246,0.8)]"
          aria-hidden
        />
      )}
    </div>
  );

  if (item.link) {
    return (
      <Link
        href={item.link}
        onClick={() => onActivate?.(item)}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/50 rounded-2xl"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/50 rounded-2xl"
      onClick={() => onActivate?.(item)}
    >
      {inner}
    </button>
  );
}
