import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { pushRecentlyViewedPlace } from "@/lib/recentlyViewed";
import AppLayout from "@/components/app-layout";
import { ReviewCard } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Phone, Globe, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { shareUrl } from "@/lib/share";
import PlaceMap from "@/components/PlaceMap";
import type { PlaceWithDetails, FavoriteStatus, Review } from "@shared/schema";

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
        title: "Нужен вход",
        description: "Сессия закончилась. Перенаправляем на страницу входа…",
        variant: "destructive",
      });
      setTimeout(() => {
        const redirect = window.location.pathname + window.location.search + window.location.hash;
        window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: place, isLoading: placeLoading, error: placeError } = useQuery<PlaceWithDetails>({
    queryKey: ["/api/places", id],
    enabled: !!id && isAuthenticated,
  });

  useEffect(() => {
    if (!place?.id) return;
    pushRecentlyViewedPlace({ id: place.id, type: place.type });
  }, [place?.id, place?.type]);

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/places", id, "reviews"],
    enabled: !!id && isAuthenticated,
  });

  const { data: favoriteStatus } = useQuery<FavoriteStatus>({
    queryKey: ["/api/favorites", id, "check"],
    enabled: !!id && isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (placeError && isUnauthorizedError(placeError as Error)) {
      toast({
        title: "Нужен вход",
        description: "Сессия закончилась. Перенаправляем на страницу входа…",
        variant: "destructive",
      });
      setTimeout(() => {
        const redirect = window.location.pathname + window.location.search + window.location.hash;
        window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
      }, 500);
    }
  }, [placeError, toast]);

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; content: string }) => {
      return await apiRequest("POST", `/api/places/${id}/reviews`, reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Отзыв добавлен",
        description: "Спасибо! Ваш отзыв опубликован.",
      });
      setReviewText("");
      setReviewRating("5");
      queryClient.invalidateQueries({ queryKey: ["/api/places", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places", id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Нужен вход",
          description: "Сессия закончилась. Перенаправляем на страницу входа…",
          variant: "destructive",
        });
        setTimeout(() => {
          const redirect = window.location.pathname + window.location.search + window.location.hash;
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось добавить отзыв. Попробуйте ещё раз.",
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
        title: favoriteStatus?.isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
        description: favoriteStatus?.isFavorite
          ? "Место убрано из избранного."
          : "Место добавлено в избранное.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Нужен вход",
          description: "Сессия закончилась. Перенаправляем на страницу входа…",
          variant: "destructive",
        });
        setTimeout(() => {
          const redirect = window.location.pathname + window.location.search + window.location.hash;
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное. Попробуйте ещё раз.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст отзыва.",
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
      <AppLayout contentClassName="py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-xl mb-8" />
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!place) {
    return (
      <AppLayout contentClassName="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Место не найдено</h1>
          <p className="text-muted-foreground">Похоже, такого места не существует или оно было удалено.</p>
        </div>
      </AppLayout>
    );
  }

  const averageRating = parseFloat(place?.averageRating || "0");

  return (
    <AppLayout contentClassName="py-8">
        {/* Place Header */}
        <div className="mb-8">
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            <img
              src={place?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"}
              alt={place?.name || "Place"}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
                className="ait-glass hover:bg-card/50"
              >
                <Heart 
                  className={`h-4 w-4 ${favoriteStatus?.isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="ait-glass hover:bg-card/50"
                onClick={() =>
                  shareUrl(window.location.href, place?.name, place?.description?.slice(0, 120))
                }
              >
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{place?.name}</h1>
                <Badge variant="outline" className="capitalize">
                  {place?.type}
                </Badge>
                {place?.isVerified && (
                  <Badge className="bg-green-500/15 text-green-500 border border-green-500/30">
                    Проверено
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
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({place?.reviewCount || 0} отзывов)
                  </span>
                </div>
                {place?.priceRange && (
                  <div className="text-primary font-medium">
                    {place.priceRange}
                  </div>
                )}
              </div>

              {place?.description && (
                <p className="text-muted-foreground mb-4">{place.description}</p>
              )}

              {place?.latitude && place?.longitude && (
                <div className="mb-6">
                  <PlaceMap
                    places={[place]}
                    center={[Number(place.latitude), Number(place.longitude)]}
                    zoom={14}
                    height="16rem"
                  />
                </div>
              )}

              <div className="space-y-2">
                {place?.address && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{place.address}</span>
                  </div>
                )}
                {place?.phone && (
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{place.phone}</span>
                  </div>
                )}
                {place?.website && (
                  <div className="flex items-center text-muted-foreground">
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
            <h3 className="text-lg font-semibold mb-4">Оставить отзыв</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Оценка</label>
                <Select value={reviewRating} onValueChange={setReviewRating}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Текст отзыва</label>
                <Textarea
                  placeholder="Поделитесь впечатлениями о месте…"
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
                {createReviewMutation.isPending ? "Публикуем…" : "Опубликовать"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Отзывы ({place?.reviewCount || 0})
          </h2>
          
          {reviewsLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Пока нет отзывов. Будьте первым!</p>
            </div>
          )}
        </div>
    </AppLayout>
  );
}
