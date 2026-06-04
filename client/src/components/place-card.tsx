import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, DollarSign } from "lucide-react";
import { Link } from "wouter";
import type { Place } from "@shared/schema";

interface PlaceCardProps {
  place: Place;
  isFavorite?: boolean;
  onToggleFavorite?: (placeId: string) => void;
}

export function PlaceCard({ place, isFavorite = false, onToggleFavorite }: PlaceCardProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      restaurant: "Ресторан",
      hotel: "Отель",
      attraction: "Достопримечательность",
    };
    return labels[type] || type;
  };

  const rating =
    typeof place.averageRating === "string"
      ? Number.parseFloat(place.averageRating) || 0
      : place.averageRating || 0;

  return (
    <Card className="group overflow-hidden ait-gradient-border transition-all hover:-translate-y-1 hover:shadow-[var(--ait-glow-purple)]">
      <div className="relative">
        <img
          src={place.imageUrl || `https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=200&fit=crop`}
          alt={place.name}
          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-70" />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-3 top-3 ${
            isFavorite ? "text-red-500" : "text-white"
          } hover:text-red-500 bg-black/15 backdrop-blur-md hover:bg-black/20`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(place.id);
          }}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </Button>
        {place.isVerified && (
          <Badge className="absolute left-3 top-3 ait-glass border-white/20 text-white hover:bg-white/10">
            Проверено
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight tracking-[-0.01em]">
            {place.name}
          </h3>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card/40 px-2 py-1">
            <Star className="h-4 w-4 fill-[var(--ait-accent)] text-[var(--ait-accent)]" />
            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({place.reviewCount || 0})</span>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {getTypeLabel(place.type)}
          </Badge>
          {place.priceRange && (
            <div className="flex items-center gap-1 rounded-full border border-border bg-card/30 px-2 py-1">
              <DollarSign className="h-4 w-4 text-[var(--ait-palm)]" />
              <span className="text-sm text-muted-foreground">{place.priceRange}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {place.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {place.description}
          </p>
        )}
        
        {place.address && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{place.address}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Link href={`/place/${place.id}`} className="flex-1">
            <Button className="w-full rounded-[16px] bg-primary hover:bg-primary/90">
              Подробнее
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlaceCard;