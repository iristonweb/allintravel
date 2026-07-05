import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Compass, Sparkles } from "lucide-react";
import AitSurface from "@/components/ait-ui/AitSurface";
import SocialTeaser from "@/components/social/SocialTeaser";
import AitLeaderboard from "@/components/ait/AitLeaderboard";
import { useTranslation } from "react-i18next";

/** Shared right rail for catalog / discovery pages */
export default function DiscoveryRightRail() {
  const { t } = useTranslation();
  const { data: places = [] } = useQuery<{ id: string; name: string; country?: string }[]>({
    queryKey: ["/api/places", { limit: "5" }],
  });

  return (
    <>
      <AitSurface padding="md" radius="lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-ait-purple" />
          <h3 className="font-semibold text-sm">{t("nav.aiScout", { defaultValue: "AI Scout" })}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t("discovery.aiHint", { defaultValue: "Plan your next adventure with AI" })}
        </p>
        <Link href="/trips" className="text-sm font-medium text-ait-purple hover:text-ait-orange transition-colors">
          {t("discovery.startPlanning", { defaultValue: "Start planning →" })}
        </Link>
      </AitSurface>

      {places.length > 0 && (
        <AitSurface padding="md" radius="lg">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4 text-ait-orange" />
            <h3 className="font-semibold text-sm">{t("discovery.popular", { defaultValue: "Popular places" })}</h3>
          </div>
          <ul className="space-y-2">
            {places.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/place/${p.id}`}
                  className="text-sm text-slate-300 hover:text-white transition-colors line-clamp-1"
                >
                  {p.name}
                  {p.country ? `, ${p.country}` : ""}
                </Link>
              </li>
            ))}
          </ul>
        </AitSurface>
      )}

      <SocialTeaser />
      <AitLeaderboard compact />
    </>
  );
}
