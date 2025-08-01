import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Users, ExternalLink } from "lucide-react";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate(),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free Entry";
    return `$${(price / 100).toFixed(0)}`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "festival":
        return "bg-accent text-white";
      case "food":
        return "bg-primary text-white";
      case "music":
        return "bg-secondary text-white";
      case "culture":
        return "bg-purple-500 text-white";
      case "sports":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getDefaultImage = (type: string) => {
    switch (type.toLowerCase()) {
      case "festival":
        return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      case "food":
        return "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      case "music":
        return "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      default:
        return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
    }
  };

  const isUpcoming = new Date(event.startDate) > new Date();
  const isPast = new Date(event.endDate || event.startDate) < new Date();
  const dateInfo = formatDate(event.startDate);

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        <img
          src={event.imageUrl || getDefaultImage(event.type)}
          alt={event.title}
          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <Badge className={`${getEventTypeColor(event.type)} capitalize`}>
            {event.type}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 bg-white/90 rounded-md px-2 py-1">
          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase">
              {dateInfo.month}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {dateInfo.day}
            </div>
          </div>
        </div>
        {isPast && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
              Past Event
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
            {event.title}
          </h3>
          <div className="flex items-center space-x-1 text-primary font-medium">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">
              {formatPrice(event.price)}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {event.description || "Join us for this exciting event!"}
        </p>

        <div className="space-y-2 mb-3">
          {event.location && (
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-2 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="h-4 w-4 mr-2 shrink-0" />
            <span>
              {dateInfo.time}
              {event.endDate && event.endDate !== event.startDate && (
                ` - ${formatDate(event.endDate).time}`
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isUpcoming && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                {Math.ceil((new Date(event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={isPast}
            className={`text-sm ${
              isPast 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:text-primary hover:border-primary"
            }`}
          >
            {isPast ? "Event Ended" : "Learn More"}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
