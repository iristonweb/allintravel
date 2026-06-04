import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { useAitDashboard } from "@/hooks/useAit";
import { CREATOR_RANKS } from "@shared/ait";

/** Motivates creators — shows rank progress */
export default function CreatorSpotlight() {
  const { data } = useAitDashboard();
  if (!data) return null;

  const next = CREATOR_RANKS.find((r) => r.minLifetimeCreator > data.lifetimeCreatorEarned);
  const progress = next
    ? Math.min(
        100,
        Math.round((data.lifetimeCreatorEarned / next.minLifetimeCreator) * 100),
      )
    : 100;

  return (
    <GlassCard className="p-4 border-ait-purple/20 bg-gradient-to-r from-ait-purple/10 to-ait-orange/5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-ait-orange" />
          <div>
            <p className="font-semibold text-sm">Создатель: {data.creatorRank.title}</p>
            <p className="text-xs text-muted-foreground">
              Creator AIT: {data.lifetimeCreatorEarned.toLocaleString("ru-RU")}
              {next ? ` · до ${next.title}: ${progress}%` : " · максимальный ранг"}
            </p>
          </div>
        </div>
        <Link
          href="/wallet"
          className="text-xs font-semibold text-ait-orange hover:underline"
        >
          AIT Hub →
        </Link>
      </div>
      {next && (
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ait-purple to-ait-orange transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </GlassCard>
  );
}
