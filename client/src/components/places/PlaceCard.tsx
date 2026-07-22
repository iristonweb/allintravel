import { Link } from "wouter";
import { motion } from "framer-motion";
import { DollarSign, Heart, MapPin, Star } from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { PLACE_CARD_FALLBACK_SRC } from "@/lib/marketing-images";
import { scaleTap } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import type { Place } from "@shared/schema";
import { useTranslation } from "react-i18next";

type PlaceCardProps = {
  place: Place;
  isFavorite?: boolean;
  onToggleFavorite?: (placeId: string) => void;
  className?: string;
};

export default function PlaceCard({
  place,
  isFavorite = false,
  onToggleFavorite,
  className,
}: PlaceCardProps) {
  const { t } = useTranslation();

  const rating =
    typeof place.averageRating === "string"
      ? Number.parseFloat(place.averageRating) || 0
      : place.averageRating || 0;

  const typeLabel = t(`filters.placeType.${place.type}`, { defaultValue: place.type });
  const coverUrl = place.imageUrl ? resolveMediaUrl(place.imageUrl) : PLACE_CARD_FALLBACK_SRC;
  const reviewCount = place.reviewCount ?? 0;

  return (
    <AitSurface
      padding="none"
      radius="card"
      hover
      className={cn("overflow-hidden group", className)}
    >
      <Link
        href={`/place/${place.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-card"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
          {place.isVerified && (
            <Badge className="absolute left-3 top-3 rounded-full border-emerald-500/30 bg-emerald-500/20 text-emerald-100 backdrop-blur-sm">
              {t("places.card.verified", { defaultValue: "Verified" })}
            </Badge>
          )}
          <div className="absolute right-3 top-3">
            <motion.button
              type="button"
              {...scaleTap}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-white/20 backdrop-blur-md transition-colors",
                isFavorite
                  ? "bg-red-500/25 text-red-300"
                  : "bg-black/25 text-white hover:bg-black/40 hover:text-red-300",
              )}
              aria-label={
                isFavorite
                  ? t("places.card.favoriteRemove", { defaultValue: "Remove from favorites" })
                  : t("places.card.favoriteAdd", { defaultValue: "Add to favorites" })
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite?.(place.id);
              }}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} strokeWidth={1.5} />
            </motion.button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-lg font-medium text-white leading-snug line-clamp-2">
              {place.name}
            </h3>
            {place.address && (
              <p className="flex items-center gap-1.5 text-sm text-white/80 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                <span className="truncate">{place.address}</span>
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full border-border/50">
            {typeLabel}
          </Badge>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card px-2.5 py-1 text-xs font-medium">
            <Star
              className="h-3.5 w-3.5 fill-ait-accent text-ait-accent"
              strokeWidth={1.5}
              aria-hidden
            />
            {rating.toFixed(1)}
            <span className="text-muted-foreground font-normal">
              {t("places.card.reviews", { count: reviewCount, defaultValue: "({{count}})" })}
            </span>
          </span>
          {place.priceRange && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-ait-palm" strokeWidth={1.5} aria-hidden />
              {place.priceRange}
            </span>
          )}
        </div>

        {place.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {place.description}
          </p>
        )}

        <motion.div {...scaleTap}>
          <AitButton variant="primary" size="sm" className="w-full" asChild>
            <Link href={`/place/${place.id}`}>
              {t("places.card.details", { defaultValue: "View details" })}
            </Link>
          </AitButton>
        </motion.div>
      </div>
    </AitSurface>
  );
}
