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
      attraction: "Достопримечательность"
    };
    return labels[type] || type;
  };

  const getPriceDisplay = (priceRange: string | null) => {
    if (!priceRange) return null;
    return priceRange;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={place.imageUrl || `https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=200&fit=crop`}
          alt={place.name}
          className="w-full h-48 object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 ${
            isFavorite ? "text-red-500" : "text-white"
          } hover:text-red-500`}
          onClick={() => onToggleFavorite?.(place.id)}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </Button>
        {place.isVerified && (
          <Badge className="absolute top-2 left-2 bg-green-500">
            Проверено
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg leading-tight">{place.name}</h3>
          <div className="flex items-center gap-1 ml-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {typeof place.averageRating === 'string' 
                ? parseFloat(place.averageRating) || 0 
                : place.averageRating || 0}
            </span>
            <span className="text-xs text-muted-foreground">
              ({place.reviewCount || 0})
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {getTypeLabel(place.type)}
          </Badge>
          {place.priceRange && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                {getPriceDisplay(place.priceRange)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {place.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {place.description}
          </p>
        )}
        
        {place.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{place.address}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Link href={`/places/${place.id}`} className="flex-1">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Подробнее
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlaceCard;