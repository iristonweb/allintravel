import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { NavigationHeader } from "@/components/navigation-header";
import { ReviewCard } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Phone, Globe, Heart, Share2 } from "lucide-react";
import { useState } from "react";

export default function PlaceDetails() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState("5");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: place, isLoading: placeLoading, error: placeError } = useQuery({
    queryKey: ["/api/places", id],
    enabled: !!id && isAuthenticated,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/places", id, "reviews"],
    enabled: !!id && isAuthenticated,
  });

  const { data: favoriteStatus } = useQuery({
    queryKey: ["/api/favorites", id, "check"],
    enabled: !!id && isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (placeError && isUnauthorizedError(placeError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [placeError, toast]);

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; content: string }) => {
      return await apiRequest("POST", `/api/places/${id}/reviews`, reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review Added",
        description: "Your review has been posted successfully!",
      });
      setReviewText("");
      setReviewRating("5");
      queryClient.invalidateQueries({ queryKey: ["/api/places", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places", id] });
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
        description: "Failed to add review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const method = favoriteStatus?.isFavorite ? "DELETE" : "POST";
      return await apiRequest(method, `/api/favorites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", id, "check"] });
      toast({
        title: favoriteStatus?.isFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: favoriteStatus?.isFavorite 
          ? "Place removed from your favorites"
          : "Place added to your favorites",
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

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a review.",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      rating: parseInt(reviewRating),
      content: reviewText,
    });
  };

  if (authLoading || placeLoading) {
    return (
      <div className="min-h-screen">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Place Not Found</h1>
            <p className="text-gray-600">The place you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = parseFloat(place.averageRating || "0");

  return (
    <div className="min-h-screen bg-white">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Place Header */}
        <div className="mb-8">
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            <img
              src={place.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
                className="bg-white/90 hover:bg-white"
              >
                <Heart 
                  className={`h-4 w-4 ${favoriteStatus?.isFavorite ? 'fill-primary text-primary' : 'text-gray-600'}`} 
                />
              </Button>
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                <Share2 className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{place.name}</h1>
                <Badge variant="outline" className="capitalize">
                  {place.type}
                </Badge>
                {place.isVerified && (
                  <Badge className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(averageRating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({place.reviewCount} reviews)
                  </span>
                </div>
                {place.priceRange && (
                  <div className="text-primary font-medium">
                    {place.priceRange}
                  </div>
                )}
              </div>

              {place.description && (
                <p className="text-gray-700 mb-4">{place.description}</p>
              )}

              <div className="space-y-2">
                {place.address && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{place.address}</span>
                  </div>
                )}
                {place.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{place.phone}</span>
                  </div>
                )}
                {place.website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      {place.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Review Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <Select value={reviewRating} onValueChange={setReviewRating}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  placeholder="Share your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleSubmitReview}
                disabled={createReviewMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createReviewMutation.isPending ? "Posting..." : "Post Review"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reviews ({place.reviewCount})
          </h2>
          
          {reviewsLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No reviews yet. Be the first to review this place!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
