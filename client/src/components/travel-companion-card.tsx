import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, DollarSign, Users, MapPin } from "lucide-react";
import type { Trip } from "@shared/schema";

interface TravelCompanionCardProps {
  trip: Trip;
}

export default function TravelCompanionCard({ trip }: TravelCompanionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinTripMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/trips/${trip.id}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Trip Request Sent",
        description: "Your request to join this trip has been sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Budget flexible";
    if (min && max) return `$${min}-${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return "Budget flexible";
  };

  const getDaysUntilTrip = () => {
    const today = new Date();
    const startDate = new Date(trip.startDate);
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Started";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const isSpotAvailable = trip.currentParticipants < trip.maxParticipants;

  return (
    <Card className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"
            alt="Trip organizer"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Trip Organizer</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="text-yellow-400 h-3 w-3 mr-1 fill-current" />
              <span>4.8 (23 trips)</span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={isSpotAvailable ? "default" : "secondary"}>
              {getDaysUntilTrip()}
            </Badge>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">
            {trip.title}
          </h4>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {trip.description}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{trip.destination}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="text-primary font-medium">
                {formatBudget(trip.budgetMin, trip.budgetMax)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {trip.currentParticipants}/{trip.maxParticipants} travelers
            </span>
          </div>

          <Button
            className={`${
              isSpotAvailable 
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => isSpotAvailable && joinTripMutation.mutate()}
            disabled={!isSpotAvailable || joinTripMutation.isPending}
          >
            {joinTripMutation.isPending 
              ? "Joining..." 
              : isSpotAvailable 
                ? "Join Trip" 
                : "Full"
            }
          </Button>
        </div>

        {trip.tags && trip.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {trip.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {trip.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{trip.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
