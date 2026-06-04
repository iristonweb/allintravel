import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Route } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Trip } from "@shared/schema";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { cn } from "@/lib/utils";

interface TravelCompanionCardProps {
  trip: Trip;
  onJoin?: (tripId: string) => void;
  isJoined?: boolean;
}

export function TravelCompanionCard({ trip, onJoin, isJoined = false }: TravelCompanionCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Не указано";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d MMM yyyy", { locale: ru });
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min} - ${max} ₽`;
    if (min) return `от ${min} ₽`;
    if (max) return `до ${max} ₽`;
    return null;
  };

  const participantsCount = trip.currentParticipants || 1;
  const maxParticipants = trip.maxParticipants || 5;
  const spotsLeft = maxParticipants - participantsCount;
  const coverUrl = trip.imageUrl ? resolveMediaUrl(trip.imageUrl) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div
        className={cn(
          "relative aspect-[16/9] w-full overflow-hidden",
          !coverUrl && "bg-gradient-to-br from-primary/20 via-ait-purple/15 to-ait-orange/10",
        )}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <Badge
          variant={trip.isActive ? "default" : "secondary"}
          className={cn(
            "absolute top-3 right-3",
            trip.isActive ? "bg-green-500 hover:bg-green-500" : "",
          )}
        >
          {trip.isActive ? "Активна" : "Завершена"}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg mb-2">{trip.title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{trip.destination}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {trip.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{trip.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {participantsCount} / {maxParticipants} участников
              </span>
            </div>

            {formatBudget(trip.budgetMin, trip.budgetMax) && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">
                  {formatBudget(trip.budgetMin, trip.budgetMax)}
                </span>
              </div>
            )}
          </div>

          {trip.tags && trip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {trip.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {trip.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{trip.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              {spotsLeft > 0 ? (
                <span className="text-green-600">
                  Осталось {spotsLeft} {spotsLeft === 1 ? "место" : "мест"}
                </span>
              ) : (
                <span className="text-red-600">Мест нет</span>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/trips/${trip.id}`}>
                <Button size="sm" variant="outline">
                  <Route className="mr-1 h-3.5 w-3.5" />
                  Маршрут
                </Button>
              </Link>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={!trip.isActive || spotsLeft === 0 || isJoined}
                onClick={() => onJoin?.(trip.id)}
              >
                {isJoined ? "Уже участвуете" : spotsLeft === 0 ? "Мест нет" : "Присоединиться"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TravelCompanionCard;
