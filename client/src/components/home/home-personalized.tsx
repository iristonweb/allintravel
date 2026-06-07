import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import HomeSectionHeader from "@/components/home/home-section-header";
import PlaceCard from "@/components/place-card";
import type { Place } from "@shared/schema";
import { getRecentTypePreference } from "@/lib/recentlyViewed";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export default function HomePersonalized() {
  const recentlyViewed = useRecentlyViewed();
  const preferredType = getRecentTypePreference();
  const recentlyViewedCount = recentlyViewed.length;

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: [
      "/api/places",
      {
        limit: 6,
        offset: 0,
        ...(preferredType && { type: preferredType }),
      },
    ],
  });

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title="Рекомендовано вам"
        description={
          recentlyViewedCount > 0
            ? "Подборка на основе истории просмотров"
            : "Сначала откройте пару мест — и мы начнём подстраиваться"
        }
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            AI-рекомендации (MVP)
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((p) => (
          <PlaceCard key={p.id} place={p} />
        ))}
      </div>
    </section>
  );
}
