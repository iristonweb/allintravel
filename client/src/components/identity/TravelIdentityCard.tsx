import PassportCard from "@/components/passport/PassportCard";
import { TrustPanel } from "@/components/trust/TrustPanel";
import { useAitDashboard } from "@/hooks/useAit";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "@/components/brand/glass-card";
import { Badge } from "@/components/ui/badge";
import { Flame, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type TravelIdentityCardProps = {
  username?: string | null;
  userId?: string | null;
  compact?: boolean;
  className?: string;
};

/** Unified travel identity: passport + trust + AIT rank + streak. */
export default function TravelIdentityCard({
  username,
  userId,
  compact,
  className,
}: TravelIdentityCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSelf = !username || username === user?.username;
  const { data: ait } = useAitDashboard(isSelf);

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

  return (
    <div className={cn("space-y-4", className)}>
      {!compact && travelScore != null && (
        <GlassCard className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-ait-purple" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("identity.travelScore", { defaultValue: "Travel Score" })}
              </p>
              <p className="text-2xl font-bold text-white">{travelScore}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {ait && (
              <>
                <Badge variant="secondary" className="rounded-full gap-1">
                  {ait.creatorRank.title}
                </Badge>
                <Badge variant="outline" className="rounded-full gap-1">
                  <Flame className="h-3 w-3 text-ait-orange" />
                  {ait.streakDays}d
                </Badge>
              </>
            )}
          </div>
        </GlassCard>
      )}
      <PassportCard username={username} compact={compact} />
      {userId && !isSelf && <TrustPanel userId={userId} />}
    </div>
  );
}
