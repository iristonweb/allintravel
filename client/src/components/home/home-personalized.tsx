import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import HomeSectionHeader from "@/components/home/home-section-header";
import PlaceCard from "@/components/places/PlaceCard";
import PlaceCardSkeleton from "@/components/places/PlaceCardSkeleton";
import type { Place } from "@shared/schema";
import { getRecentTypePreference } from "@/lib/recentlyViewed";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { loadOnboardingPrefs } from "@/lib/onboarding";

export default function HomePersonalized() {
  const { t } = useTranslation();
  const recentlyViewed = useRecentlyViewed();
  const preferredType = getRecentTypePreference();
  const recentlyViewedCount = recentlyViewed.length;
  const onboardingPrefs = loadOnboardingPrefs();

  const { data: places = [], isLoading } = useQuery<Place[]>({
    queryKey: [
      "/api/places",
      {
        limit: 6,
        offset: 0,
        ...(preferredType && { type: preferredType }),
      },
    ],
  });

  const description = onboardingPrefs?.destination
    ? t("home.personalized.forDestination", {
        destination:
          onboardingPrefs.destination.split(",")[0]?.trim() ?? onboardingPrefs.destination,
      })
    : recentlyViewedCount > 0
      ? t("home.personalized.fromHistory")
      : t("home.personalized.startBrowsing");

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title={t("home.personalized.title")}
        description={description}
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {t("home.personalized.badge")}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}
    </section>
  );
}
