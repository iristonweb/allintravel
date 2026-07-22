import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, DollarSign, MapPin, User } from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { EVENT_CARD_FALLBACK_SRC } from "@/lib/marketing-images";
import { scaleTap } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import type { Event } from "@shared/schema";
import { useTranslation } from "react-i18next";

type EventCardProps = {
  event: Event;
  onRegister?: (eventId: string) => void;
  isRegistered?: boolean;
  registerPending?: boolean;
  className?: string;
  dimmed?: boolean;
};

export default function EventCard({
  event,
  onRegister,
  isRegistered = false,
  registerPending = false,
  className,
  dimmed = false,
}: EventCardProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;

  const startDate = new Date(event.startDate);
  const now = new Date();
  const isPastEvent = startDate < now;
  const isUpcoming = startDate > now;

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d MMM yyyy, HH:mm", { locale: dateLocale });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return t("events.card.free", { defaultValue: "Free" });
    const amount = (price / 100).toLocaleString(i18n.language);
    return t("events.card.price", { amount, defaultValue: "{{amount}} ₽" });
  };

  const typeLabel = t(`filters.eventType.${event.type}`, { defaultValue: event.type });
  const coverUrl = event.imageUrl ? resolveMediaUrl(event.imageUrl) : EVENT_CARD_FALLBACK_SRC;

  const statusLabel = isPastEvent
    ? t("events.card.past", { defaultValue: "Ended" })
    : isUpcoming
      ? t("events.card.upcoming", { defaultValue: "Soon" })
      : t("events.card.ongoing", { defaultValue: "Live" });

  const canRegister = !isPastEvent && !isRegistered;

  return (
    <AitSurface
      padding="none"
      radius="card"
      hover={!dimmed}
      className={cn("overflow-hidden group", dimmed && "opacity-75", className)}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <Badge
          variant="secondary"
          className={cn(
            "absolute top-3 right-3 rounded-full border-border/50 backdrop-blur-sm",
            isPastEvent
              ? "bg-muted/80 text-muted-foreground"
              : isUpcoming
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                : "bg-blue-500/20 text-blue-200 border-blue-500/30",
          )}
        >
          {statusLabel}
        </Badge>
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 rounded-full border-border/50 backdrop-blur-sm"
        >
          {typeLabel}
        </Badge>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg font-medium text-white leading-snug line-clamp-2">{event.title}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-ait-purple" strokeWidth={1.5} aria-hidden />
            <span className="truncate">{formatDate(event.startDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ait-orange" strokeWidth={1.5} aria-hidden />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 shrink-0 text-ait-palm" strokeWidth={1.5} aria-hidden />
            <span>{formatPrice(event.price)}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {event.organizerId ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="truncate">{t("events.card.organizer", { defaultValue: "Organizer" })}</span>
            </div>
          ) : (
            <span />
          )}
          {onRegister && (
            <motion.div {...scaleTap}>
              <AitButton
                variant={canRegister ? "primary" : "glass"}
                size="sm"
                disabled={!canRegister || registerPending}
                onClick={() => onRegister(event.id)}
              >
                {isPastEvent
                  ? t("events.card.ended", { defaultValue: "Ended" })
                  : isRegistered
                    ? t("events.card.registered", { defaultValue: "Registered" })
                    : t("events.card.register", { defaultValue: "Join" })}
              </AitButton>
            </motion.div>
          )}
        </div>
      </div>
    </AitSurface>
  );
}
