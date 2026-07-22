import { Link } from "wouter";
import { format, differenceInCalendarDays } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, GitFork, MapPin, Route, User } from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { TRIP_CARD_FALLBACK_SRC } from "@/lib/marketing-images";
import { scaleTap } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import type { Trip } from "@shared/schema";
import { useTranslation } from "react-i18next";

type TripCardProps = {
  trip: Trip;
  onJoin?: (tripId: string) => void;
  isJoined?: boolean;
  joinPending?: boolean;
  className?: string;
};

function ParticipantStack({ count }: { count: number }) {
  const shown = Math.min(Math.max(count, 1), 3);
  return (
    <div className="flex -space-x-2" aria-hidden>
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-ait-purple/15"
        >
          <User className="h-3.5 w-3.5 text-ait-purple" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}

export default function TripCard({
  trip,
  onJoin,
  isJoined = false,
  joinPending = false,
  className,
}: TripCardProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;

  const formatDate = (date: Date | string | null) => {
    if (!date) return t("tripsPage.card.dateUnknown", { defaultValue: "TBD" });
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d MMM yyyy", { locale: dateLocale });
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max)
      return t("tripsPage.card.budgetRange", {
        min,
        max,
        defaultValue: "{{min}}–{{max}} ₽",
      });
    if (min) return t("tripsPage.card.budgetFrom", { min, defaultValue: "from {{min}} ₽" });
    if (max) return t("tripsPage.card.budgetTo", { max, defaultValue: "up to {{max}} ₽" });
    return null;
  };

  const participantsCount = trip.currentParticipants ?? 1;
  const maxParticipants = trip.maxParticipants ?? 5;
  const spotsLeft = maxParticipants - participantsCount;
  const coverUrl = trip.imageUrl ? resolveMediaUrl(trip.imageUrl) : TRIP_CARD_FALLBACK_SRC;
  const budgetLabel = formatBudget(trip.budgetMin, trip.budgetMax);

  const dayCount =
    trip.startDate && trip.endDate
      ? Math.max(1, differenceInCalendarDays(new Date(trip.endDate), new Date(trip.startDate)) + 1)
      : null;

  const isForked = Boolean(trip.forkedFromTripId);
  const canJoin = trip.isActive && spotsLeft > 0 && !isJoined;

  return (
    <AitSurface
      padding="none"
      radius="card"
      hover
      className={cn("overflow-hidden group", className)}
    >
      <Link
        href={`/trips/${trip.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-card"
      >
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <Badge
            variant="secondary"
            className={cn(
              "absolute top-3 right-3 rounded-full border-border/50 backdrop-blur-sm",
              trip.isActive
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                : "bg-muted/80 text-muted-foreground",
            )}
          >
            {trip.isActive
              ? t("tripsPage.card.active", { defaultValue: "Active" })
              : t("tripsPage.card.completed", { defaultValue: "Completed" })}
          </Badge>
          {isForked && (
            <Badge className="absolute top-3 left-3 rounded-full bg-ait-orange/20 text-ait-orange border-ait-orange/30 gap-1">
              <GitFork className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              {t("tripsPage.card.forked", { defaultValue: "Forked" })}
            </Badge>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-lg font-medium text-white leading-snug line-clamp-2">
              {trip.title}
            </h3>
            <p className="flex items-center gap-1.5 text-sm text-white/80 mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="truncate">{trip.destination}</span>
            </p>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {dayCount != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-ait-purple" strokeWidth={1.5} aria-hidden />
              {t("tripsPage.card.days", { count: dayCount, defaultValue: "{{count}} days" })}
            </span>
          )}
          {budgetLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-ait-orange" strokeWidth={1.5} aria-hidden />
              {budgetLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
          <span className="truncate">
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </span>
        </div>

        {trip.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {trip.description}
          </p>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <ParticipantStack count={participantsCount} />
          <span className="text-sm text-muted-foreground truncate">
            {t("tripsPage.card.participants", {
              current: participantsCount,
              max: maxParticipants,
              defaultValue: "{{current}}/{{max}} travelers",
            })}
          </span>
        </div>

        {trip.tags && trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full text-xs border-border/50">
                {tag}
              </Badge>
            ))}
            {trip.tags.length > 3 && (
              <Badge variant="outline" className="rounded-full text-xs border-border/50">
                +{trip.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <p className="text-sm font-medium">
            {spotsLeft > 0 ? (
              <span className="text-emerald-400">
                {t("tripsPage.card.spotsLeft", {
                  count: spotsLeft,
                  defaultValue: "{{count}} spots left",
                })}
              </span>
            ) : (
              <span className="text-destructive">
                {t("tripsPage.card.noSpots", { defaultValue: "Full" })}
              </span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap justify-end">
            <motion.div {...scaleTap}>
              <AitButton variant="glass" size="sm" className="gap-1.5" asChild>
                <Link href={`/trips/${trip.id}`}>
                  <Route className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  {t("tripsPage.card.route", { defaultValue: "Route" })}
                </Link>
              </AitButton>
            </motion.div>
            {isForked && (
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <AitButton variant="glass" size="sm" className="gap-1.5" asChild>
                  <Link href={`/trips/${trip.id}`}>
                    <GitFork className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    {t("marketplace.fork", { defaultValue: "Fork" })}
                  </Link>
                </AitButton>
              </motion.div>
            )}
            <AitButton
              variant="primary"
              size="sm"
              disabled={!canJoin || joinPending}
              onClick={() => onJoin?.(trip.id)}
            >
              {isJoined
                ? t("tripsPage.card.joined", { defaultValue: "Joined" })
                : spotsLeft === 0
                  ? t("tripsPage.card.noSpots", { defaultValue: "Full" })
                  : t("tripsPage.card.join", { defaultValue: "Join" })}
            </AitButton>
          </div>
        </div>
      </div>
    </AitSurface>
  );
}
