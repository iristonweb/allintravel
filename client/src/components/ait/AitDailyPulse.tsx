import { Link } from "wouter";
import { Sparkles, MessageCircle, Image, Heart, LogIn } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { useAitDashboard } from "@/hooks/useAit";
import { type ActivityRingId } from "@shared/ait";
import { useAitRingLabels } from "@/hooks/useAitRingLabels";
import { useTranslation } from "react-i18next";

const RING_ICONS: Record<ActivityRingId, typeof Sparkles> = {
  voice: MessageCircle,
  story: Image,
  echo: Heart,
  pulse: LogIn,
};

const RING_LINKS: Record<ActivityRingId, string> = {
  voice: "/chat",
  story: "/social-feed",
  echo: "/social-feed",
  pulse: "/",
};

const RING_ORDER: ActivityRingId[] = ["voice", "story", "echo", "pulse"];

export default function AitDailyPulse() {
  const { t } = useTranslation();
  const ringLabels = useAitRingLabels();
  const { data } = useAitDashboard();
  if (!data) return null;

  const rings = data.rings as Record<ActivityRingId, { count: number; percent: number }>;
  const incomplete = RING_ORDER.filter((id) => (rings[id]?.percent ?? 0) < 100);
  if (incomplete.length === 0 && data.allRingsFull) {
    return (
      <GlassCard className="p-4 border-ait-orange/30 bg-gradient-to-r from-ait-orange/10 to-transparent">
        <p className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ait-orange" />
          {t("ait.dailyPulse.allComplete")}
        </p>
        <Link href="/wallet" className="text-xs text-ait-orange hover:underline mt-2 inline-block">
          {t("ait.dailyPulse.openHub")}
        </Link>
      </GlassCard>
    );
  }

  const focus = incomplete[0];
  if (!focus) return null;
  const Icon = RING_ICONS[focus];

  return (
    <GlassCard className="p-4 border-ait-purple/20">
      <p className="text-xs font-bold uppercase tracking-widest text-ait-purple mb-2">
        {t("ait.dailyPulse.title")}
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        {t("ait.dailyPulse.ringProgress", {
          ring: ringLabels[focus],
          count: rings[focus]?.count ?? 0,
        })}
      </p>
      <Link
        href={RING_LINKS[focus]}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ait-orange hover:underline"
      >
        <Icon className="h-4 w-4" />
        {t("ait.dailyPulse.continue")}
      </Link>
    </GlassCard>
  );
}
