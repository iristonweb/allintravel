import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Event } from "@shared/schema";
import { EVENT_CARD_FALLBACK_SRC } from "@/lib/site-meta";

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  isRegistered?: boolean;
}

export function EventCard({ event, onRegister, isRegistered = false }: EventCardProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "d MMM yyyy, HH:mm", { locale: ru });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Бесплатно";
    return `${price} ₽`;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      festival: "Фестиваль",
      food: "Еда",
      music: "Музыка",
      culture: "Культура",
      sport: "Спорт",
      nature: "Природа"
    };
    return labels[type] || type;
  };

  const isPastEvent = new Date(event.startDate) < new Date();
  const isUpcoming = new Date(event.startDate) > new Date();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={event.imageUrl || EVENT_CARD_FALLBACK_SRC}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <Badge 
          className={`absolute top-2 right-2 ${
            isPastEvent
              ? "bg-muted text-muted-foreground border border-border"
              : isUpcoming
                ? "bg-green-500 text-white"
                : "bg-blue-500 text-white"
          }`}
        >
          {isPastEvent ? "Завершено" : isUpcoming ? "Скоро" : "Идет"}
        </Badge>
        <Badge variant="secondary" className="absolute top-2 left-2">
          {getTypeLabel(event.type)}
        </Badge>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatPrice(event.price)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {event.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            {event.organizerId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Организатор</span>
              </div>
            )}
            
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90"
              disabled={isPastEvent || isRegistered}
              onClick={() => onRegister?.(event.id)}
            >
              {isPastEvent 
                ? "Завершено" 
                : isRegistered 
                  ? "Зарегистрированы" 
                  : "Участвовать"
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EventCard;