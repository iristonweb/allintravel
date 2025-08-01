import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Share2, MapPin } from "lucide-react";
import type { Place } from "@shared/schema";

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      // TODO: Check current favorite status first
      return await apiRequest("POST", `/api/favorites/${place.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Added to Favorites",
        description: "Place added to your favorites",
      });
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
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const averageRating = parseFloat(place.averageRating || "0");

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case "$": return "text-green-600";
      case "$$": return "text-yellow-600";
      case "$$$": return "text-orange-600";
      case "$$$$": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "restaurant":
        return "🍽️";
      case "hotel":
        return "🏨";
      case "attraction":
        return "🎯";
      default:
        return "📍";
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
      <Link href={`/place/${place.id}`}>
        <div className="relative">
          <img
            src={place.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"}
            alt={place.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              {getTypeIcon(place.type)} {place.type}
            </Badge>
          </div>
          {place.isVerified && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-100 text-green-800">
                ✓ Verified
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/place/${place.id}`}>
            <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-1">
              {place.name}
            </h3>
          </Link>
          <div className="flex items-center">
            <Star className="text-yellow-400 h-4 w-4 fill-current" />
            <span className="text-sm text-gray-600 ml-1">
              {averageRating.toFixed(1)}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {place.description || "Discover this amazing place"}
        </p>

        {place.address && (
          <div className="flex items-center text-gray-500 text-xs mb-3">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`font-medium ${getPriceRangeColor(place.priceRange || "$")}`}>
            {place.priceRange || "Price varies"}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavoriteMutation.mutate();
              }}
              disabled={toggleFavoriteMutation.isPending}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement share functionality
                navigator.share?.({
                  title: place.name,
                  text: place.description,
                  url: window.location.origin + `/place/${place.id}`
                });
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {place.reviewCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {place.reviewCount} review{place.reviewCount !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
