import { Link } from "wouter";
import { Sparkles, MessageCircle, Image, Heart, LogIn } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { useAitDashboard } from "@/hooks/useAit";
import { RING_LABELS, type ActivityRingId } from "@shared/ait";

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

export default function AitDailyPulse() {
  const { data } = useAitDashboard();
  if (!data) return null;

  const rings = data.rings as Record<ActivityRingId, { count: number; percent: number }>;
  const incomplete = (Object.keys(RING_LABELS) as ActivityRingId[]).filter(
    (id) => (rings[id]?.percent ?? 0) < 100,
  );
  if (incomplete.length === 0 && data.allRingsFull) {
    return (
      <GlassCard className="p-4 border-ait-orange/30 bg-gradient-to-r from-ait-orange/10 to-transparent">
        <p className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ait-orange" />
          Все кольца закрыты — зайдите в AIT Hub за бонусом!
        </p>
        <Link href="/wallet" className="text-xs text-ait-orange hover:underline mt-2 inline-block">
          Открыть AIT Hub →
        </Link>
      </GlassCard>
    );
  }

  const focus = incomplete[0];
  if (!focus) return null;
  const Icon = RING_ICONS[focus];

  return (
    <GlassCard className="p-4 border-ait-purple/20">
      <p className="text-xs font-bold uppercase tracking-widest text-ait-purple mb-2">Пульс дня</p>
      <p className="text-sm text-muted-foreground mb-3">
        Закройте кольцо «{RING_LABELS[focus]}» — {rings[focus]?.count ?? 0}/5 сегодня
      </p>
      <Link
        href={RING_LINKS[focus]}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ait-orange hover:underline"
      >
        <Icon className="h-4 w-4" />
        Продолжить
      </Link>
    </GlassCard>
  );
}
