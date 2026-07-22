import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useId } from "react";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import EmptyState from "@/components/empty-state";
import AchievementMasonryGrid from "@/components/passport/AchievementMasonryGrid";
import PassportCardSkeleton from "@/components/passport/PassportCardSkeleton";
import PassportStampBadge from "@/components/passport/PassportStampBadge";
import PassportStatPill from "@/components/passport/PassportStatPill";
import { Globe, MapPin, Plane, Share2, Stamp, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { sharePassportProfile } from "@/lib/passport-share";
import { useAuth } from "@/hooks/useAuth";

export type PassportData = {
  countriesCount: number;
  citiesCount: number;
  tripsCount: number;
  stamps: {
    id: string;
    countryName: string;
    cityName: string | null;
    visitedAt: string | null;
    tripId?: string | null;
  }[];
  achievements: string[];
};

const ACHIEVEMENT_LABELS: Record<string, string> = {
  explorer: "passport.explorer",
  globetrotter: "passport.globetrotter",
  world_citizen: "passport.worldCitizen",
  city_hopper: "passport.explorer",
  route_builder: "passport.explorer",
};

type PassportCardProps = {
  username?: string | null;
  compact?: boolean;
  embedded?: boolean;
};

export default function PassportCard({ username, compact, embedded }: PassportCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const achievementsHeadingId = useId();
  const stampsHeadingId = useId();

  const endpoint = username ? `/api/passport/public/${username}` : "/api/passport/me";

  const { data, isLoading, isError, refetch } = useQuery<PassportData>({
    queryKey: [endpoint],
    enabled: Boolean(user) || Boolean(username),
  });

  const handleShare = async () => {
    const handle = username ?? user?.username;
    if (!handle) return;
    await sharePassportProfile(handle, t, toast);
  };

  if (isLoading) {
    return <PassportCardSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        variant="glass"
        icon={AlertCircle}
        title={t("passport.loadError", { defaultValue: "Could not load passport" })}
        description={t("passport.loadErrorHint", {
          defaultValue: "Check your connection and try again.",
        })}
        action={
          <AitButton variant="glass" size="sm" onClick={() => refetch()}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AitButton>
        }
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        variant="glass"
        icon={Stamp}
        title={t("passport.emptyTitle", { defaultValue: "Your passport awaits" })}
        description={t("passport.emptyDescription", {
          defaultValue:
            "Every journey leaves a mark. Plan a trip or explore the map to collect your first stamp.",
        })}
      />
    );
  }

  const achievements = data.achievements.map((id) => ({
    id,
    label: t(ACHIEVEMENT_LABELS[id] ?? "passport.explorer"),
  }));

  const visibleStamps = data.stamps.slice(0, 24);
  const hiddenStampCount = data.stamps.length - visibleStamps.length;

  return (
    <AitSurface padding="md" radius="card" glow className="space-y-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-ait-purple/10 via-transparent to-ait-orange/10 pointer-events-none" />

      {!embedded && (
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-ait-purple mb-1">
              <Globe className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">allintravel</span>
            </div>
            <h2 className="text-lg font-medium text-foreground leading-snug">
              {t("passport.title")}
            </h2>
            {!compact && (
              <p className="text-base text-muted-foreground leading-relaxed mt-1">
                {t("passport.subtitle")}
              </p>
            )}
          </div>
          <AitButton variant="glass" size="sm" className="gap-2 shrink-0" onClick={handleShare}>
            <Share2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            {t("passport.shareCard")}
          </AitButton>
        </div>
      )}

      <div className="relative grid grid-cols-3 gap-4">
        <PassportStatPill
          icon={Globe}
          value={data.countriesCount}
          label={t("passport.countries")}
        />
        <PassportStatPill icon={MapPin} value={data.citiesCount} label={t("passport.cities")} />
        <PassportStatPill icon={Plane} value={data.tripsCount} label={t("passport.trips")} />
      </div>

      {achievements.length > 0 && (
        <section className="relative space-y-3" aria-labelledby={achievementsHeadingId}>
          <h3
            id={achievementsHeadingId}
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {t("passport.achievements")}
          </h3>
          <AchievementMasonryGrid achievements={achievements} />
        </section>
      )}

      {!compact && (
        <section className="relative space-y-3" aria-labelledby={stampsHeadingId}>
          <h3
            id={stampsHeadingId}
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {t("passport.stamps", { defaultValue: "Stamps" })}
          </h3>
          {data.stamps.length === 0 ? (
            <EmptyState
              variant="glass"
              icon={Stamp}
              title={t("passport.emptyTitle", { defaultValue: "Your passport awaits" })}
              description={t("passport.emptyDescription", {
                defaultValue:
                  "Every journey leaves a mark. Plan a trip or explore the map to collect your first stamp.",
              })}
              action={
                <div className="flex flex-wrap gap-2 justify-center">
                  <AitButton variant="primary" size="sm" asChild>
                    <Link href="/trips">
                      {t("passport.planTrip", { defaultValue: "Plan a trip" })}
                    </Link>
                  </AitButton>
                  <AitButton variant="glass" size="sm" asChild>
                    <Link href="/map">
                      {t("passport.exploreMap", { defaultValue: "Explore map" })}
                    </Link>
                  </AitButton>
                </div>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[min(24rem,50vh)] overflow-y-auto ait-scrollbar pr-1">
                {visibleStamps.map((stamp) => (
                  <PassportStampBadge key={stamp.id} stamp={stamp} />
                ))}
              </div>
              {hiddenStampCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("passport.moreStamps", {
                    defaultValue: "+{{count}} more stamps",
                    count: hiddenStampCount,
                  })}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </AitSurface>
  );
}
