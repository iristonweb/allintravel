import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

import HomeSectionHeader from "@/components/home/home-section-header";
import PlaceCard from "@/components/place-card";
import type { Place } from "@shared/schema";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export default function HomeSimilar() {
  const { t } = useTranslation();
  const recentlyViewed = useRecentlyViewed();
  const last = recentlyViewed[0];

  const type = last?.type ?? undefined;
  const excludeId = last?.id ?? undefined;

  const enabled = Boolean(type);

  const { data: places = [], isLoading } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 9, ...(type && { type }) }],
    enabled,
  });

  const filtered = useMemo(() => {
    const list = (excludeId ? places.filter((p) => p.id !== excludeId) : places).slice();

    list.sort((a, b) => {
      const ar =
        typeof a.averageRating === "string"
          ? Number.parseFloat(a.averageRating) || 0
          : a.averageRating || 0;
      const br =
        typeof b.averageRating === "string"
          ? Number.parseFloat(b.averageRating) || 0
          : b.averageRating || 0;
      const ac = a.reviewCount || 0;
      const bc = b.reviewCount || 0;
      if (br !== ar) return br - ar;
      return bc - ac;
    });

    const seen = new Set<string>();
    const deduped: Place[] = [];
    for (const p of list) {
      const key = (p.name || "").trim().toLowerCase();
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      deduped.push(p);
      if (deduped.length >= 6) break;
    }

    return deduped;
  }, [places, excludeId]);

  if (!enabled) return null;

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title={t("home.similar.title")}
        description={t("home.similar.description")}
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            {t("home.similar.badge")}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[340px] rounded-[20px] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}
    </section>
  );
}
