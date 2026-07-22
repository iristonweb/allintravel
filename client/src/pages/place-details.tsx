import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { pushRecentlyViewedPlace } from "@/lib/recentlyViewed";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import PlaceDetailSkeleton from "@/components/places/PlaceDetailSkeleton";
import { ReviewCard } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, Phone, Globe, Heart, Share2, AlertCircle, LogIn } from "lucide-react";
import AddPlaceToTripButton from "@/components/places/AddPlaceToTripButton";
import AffiliateHotelWidget from "@/components/monetization/AffiliateHotelWidget";
import { Link } from "wouter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import EmptyState from "@/components/empty-state";
import { useState } from "react";
import { shareUrl } from "@/lib/share";
import TravelMap from "@/components/maps/TravelMap";
import { useTranslation } from "react-i18next";
import type { PlaceWithDetails, FavoriteStatus, Review } from "@shared/schema";
import { PLACE_CARD_FALLBACK_SRC } from "@/lib/marketing-images";

export default function PlaceDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState("5");

  const {
    data: place,
    isLoading: placeLoading,
    isError: placeIsError,
    error: placeError,
    refetch: refetchPlace,
  } = useQuery<PlaceWithDetails>({
    queryKey: ["/api/places", id],
    enabled: !!id,
  });

  useDocumentMeta(
    place
      ? {
          title: `${place.name} | All In Travel`,
          description:
            place.description?.slice(0, 160) ?? t("placeDetail.metaDescription", { name: place.name }),
          image: place.imageUrl ?? undefined,
          url: `${window.location.origin}/place/${id}`,
        }
      : null,
  );

  useEffect(() => {
    if (!place?.id || !isAuthenticated) return;
    pushRecentlyViewedPlace({ id: place.id, type: place.type });
  }, [place?.id, place?.type, isAuthenticated]);

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/places", id, "reviews"],
    enabled: !!id,
  });

  const { data: favoriteStatus } = useQuery<FavoriteStatus>({
    queryKey: ["/api/favorites", id, "check"],
    enabled: !!id && isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (placeError && isUnauthorizedError(placeError as Error)) {
      toast({
        title: t("placeDetail.toast.signInRequired"),
        description: t("placeDetail.toast.sessionExpired"),
        variant: "destructive",
      });
      setTimeout(() => {
        const redirect = window.location.pathname + window.location.search + window.location.hash;
        window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
      }, 500);
    }
  }, [placeError, toast, t]);

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; content: string }) => {
      return await apiRequestJson("POST", `/api/places/${id}/reviews`, reviewData);
    },
    onSuccess: () => {
      toast({
        title: t("placeDetail.toast.reviewAdded"),
        description: t("placeDetail.toast.reviewThanks"),
      });
      setReviewText("");
      setReviewRating("5");
      queryClient.invalidateQueries({ queryKey: ["/api/places", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places", id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("placeDetail.toast.signInRequired"),
          description: t("placeDetail.toast.sessionExpired"),
          variant: "destructive",
        });
        setTimeout(() => {
          const redirect = window.location.pathname + window.location.search + window.location.hash;
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
        }, 500);
        return;
      }
      toast({
        title: t("placeDetail.toast.error"),
        description: t("placeDetail.toast.reviewFailed"),
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
        title: favoriteStatus?.isFavorite
          ? t("placeDetail.toast.favoriteRemoved")
          : t("placeDetail.toast.favoriteAdded"),
        description: favoriteStatus?.isFavorite
          ? t("placeDetail.toast.favoriteRemovedHint")
          : t("placeDetail.toast.favoriteAddedHint"),
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("placeDetail.toast.signInRequired"),
          description: t("placeDetail.toast.sessionExpired"),
          variant: "destructive",
        });
        setTimeout(() => {
          const redirect = window.location.pathname + window.location.search + window.location.hash;
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
        }, 500);
        return;
      }
      toast({
        title: t("placeDetail.toast.error"),
        description: t("placeDetail.toast.favoriteFailed"),
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      toast({
        title: t("placeDetail.toast.error"),
        description: t("placeDetail.toast.reviewEmpty"),
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      rating: parseInt(reviewRating),
      content: reviewText,
    });
  };

  if (placeLoading) {
    return (
      <AppLayout contentClassName="py-8" rightRail={<DiscoveryRightRail />}>
        <PlaceDetailSkeleton />
      </AppLayout>
    );
  }

  if (placeIsError && placeError && !isUnauthorizedError(placeError as Error)) {
    return (
      <AppLayout contentClassName="py-8" rightRail={<DiscoveryRightRail />}>
        <EmptyState
          variant="glass"
          icon={AlertCircle}
          title={t("placeDetail.loadError")}
          description={placeError instanceof Error ? placeError.message : undefined}
          action={
            <AitButton variant="glass" size="sm" onClick={() => refetchPlace()}>
              {t("common.retry")}
            </AitButton>
          }
        />
      </AppLayout>
    );
  }

  if (!place) {
    return (
      <AppLayout contentClassName="py-8" rightRail={<DiscoveryRightRail />}>
        <EmptyState
          variant="glass"
          title={t("placeDetail.notFoundTitle")}
          description={t("placeDetail.notFoundHint")}
          className="max-w-md mx-auto"
        />
      </AppLayout>
    );
  }

  const averageRating = parseFloat(place?.averageRating || "0");
  const typeLabel = t(`filters.placeType.${place.type}`, { defaultValue: place.type });

  return (
    <AppLayout contentClassName="py-8" rightRail={<DiscoveryRightRail />}>
      <ReelsPageLayout
        header={
          <div className="space-y-2">
            <Link
              href="/places"
              className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
            >
              ← {t("placeDetail.breadcrumbPlaces")}
            </Link>
            <AitSectionHeader title={place.name} />
          </div>
        }
        feed={
          <>
      <div className="relative h-64 md:h-96 rounded-card-xl overflow-hidden mb-6">
          <img
            src={place?.imageUrl || PLACE_CARD_FALLBACK_SRC}
            alt={place?.name || "Place"}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex space-x-2">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
                className="ait-glass hover:bg-card/50"
              >
                <Heart
                  className={`h-4 w-4 ${favoriteStatus?.isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </Button>
            ) : null}
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

        <AitSurface className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-2xl font-semibold text-foreground">{place?.name}</h2>
                <Badge variant="outline" className="capitalize rounded-full">
                  {typeLabel}
                </Badge>
                {place?.isVerified && (
                  <Badge className="bg-green-500/15 text-green-500 border border-green-500/30 rounded-full">
                    {t("placeDetail.verified")}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(averageRating) ? "fill-current" : ""}`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("placeDetail.reviewsCount", {
                      rating: averageRating.toFixed(1),
                      count: place?.reviewCount || 0,
                    })}
                  </span>
                </div>
                {place?.priceRange && (
                  <div className="text-primary font-medium">{place.priceRange}</div>
                )}
              </div>

              {place?.description && (
                <p className="text-muted-foreground mb-4">{place.description}</p>
              )}

              {place?.latitude && place?.longitude && (
                <div className="mb-6">
                  <TravelMap
                    places={[
                      {
                        id: place.id,
                        name: place.name,
                        type: place.type ?? undefined,
                        latitude: place.latitude,
                        longitude: place.longitude,
                      },
                    ]}
                    height="16rem"
                    className="rounded-xl overflow-hidden"
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
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {place.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {isAuthenticated ? (
                <AddPlaceToTripButton placeId={place.id} placeName={place.name} />
              ) : (
                <AitButton variant="primary" size="sm" className="gap-2" asChild>
                  <Link href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                    <LogIn className="h-4 w-4" strokeWidth={1.5} />
                    {t("placeDetail.signInToAddTrip")}
                  </Link>
                </AitButton>
              )}
            </div>
          </div>
        </AitSurface>

        {place.type === "hotel" && (
          <div className="mb-6">
            <AffiliateHotelWidget placeName={place.name} city={place.address?.split(",")[0]} />
          </div>
        )}

      {isAuthenticated ? (
        <AitSurface className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{t("placeDetail.addReview")}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("placeDetail.ratingLabel")}</label>
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
              <label className="block text-sm font-medium mb-2">{t("placeDetail.reviewTextLabel")}</label>
              <Textarea
                placeholder={t("placeDetail.reviewPlaceholder")}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <AitButton
              onClick={handleSubmitReview}
              disabled={createReviewMutation.isPending}
              variant="primary"
              size="sm"
            >
              {createReviewMutation.isPending
                ? t("placeDetail.publishing")
                : t("placeDetail.publish")}
            </AitButton>
          </div>
        </AitSurface>
      ) : (
        <AitSurface className="mb-8 text-center">
          <p className="text-muted-foreground mb-3">{t("placeDetail.signInToReview")}</p>
          <AitButton variant="glass" size="sm" asChild>
            <Link href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
              {t("placeDetail.signIn")}
            </Link>
          </AitButton>
        </AitSurface>
      )}

      <AitSurface>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {t("placeDetail.reviewsTitle", { count: place?.reviewCount || 0 })}
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
          <p className="text-center py-8 text-muted-foreground">{t("placeDetail.noReviews")}</p>
        )}
      </AitSurface>
          </>
        }
      />
    </AppLayout>
  );
}
