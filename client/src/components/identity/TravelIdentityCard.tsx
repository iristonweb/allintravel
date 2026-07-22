import PassportCard from "@/components/passport/PassportCard";
import TravelScoreHeroSkeleton from "@/components/passport/TravelScoreHeroSkeleton";
import { TrustPanel } from "@/components/trust/TrustPanel";
import { useAitDashboard } from "@/hooks/useAit";
import { useAuth } from "@/hooks/useAuth";
import AitSurface from "@/components/ait-ui/AitSurface";
import RadialScoreRing from "@/components/ui/radial-score-ring";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type TravelIdentityCardProps = {
  username?: string | null;
  userId?: string | null;
  compact?: boolean;
  /** Hide passport card chrome when page header already shows title/share */
  embedded?: boolean;
  className?: string;
};

/** Unified travel identity: passport + trust + AIT rank + streak. */
export default function TravelIdentityCard({
  username,
  userId,
  compact,
  embedded,
  className,
}: TravelIdentityCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSelf = username ? username === user?.username : true;
  const { data: ait, isLoading: aitLoading, isError: aitError } = useAitDashboard(isSelf);

  const travelScore = ait
    ? Math.min(
        100,
        Math.round(
          (ait.lifetimeSpendEarned / 5000) * 30 +
            (ait.lifetimeCreatorEarned / 1000) * 25 +
            ait.streakDays * 2 +
            (ait.creatorRank.id === "scout" ? 10 : 20),
        ),
      )
    : null;

  const showHero = !compact && isSelf;

  return (
    <div className={cn(embedded ? "space-y-6" : "space-y-section", className)}>
      {showHero && aitLoading && <TravelScoreHeroSkeleton />}
      {showHero && !aitLoading && !aitError && travelScore != null && (
        <AitSurface padding="md" radius="card" glow className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-ait-purple/10 via-transparent to-ait-orange/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:justify-between">
            <RadialScoreRing
              value={travelScore}
              max={100}
              size={120}
              label={t("identity.travelScore", { defaultValue: "Travel Score" })}
              ariaLabel={t("identity.travelScoreAria", {
                defaultValue: "Travel score {{score}} out of 100",
                score: travelScore,
              })}
              className="scale-[0.8] sm:scale-100 origin-center"
            />
            {ait && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <Badge variant="secondary" className="rounded-full gap-1">
                  {ait.creatorRank.title}
                </Badge>
                <Badge variant="outline" className="rounded-full gap-1 border-border/50">
                  <Flame className="h-3 w-3 text-ait-orange" strokeWidth={1.5} aria-hidden />
                  {ait.streakDays}d
                </Badge>
              </div>
            )}
          </div>
        </AitSurface>
      )}
      <PassportCard username={username} compact={compact} embedded={embedded} />
      {userId && !isSelf && <TrustPanel userId={userId} compact />}
    </div>
  );
}
