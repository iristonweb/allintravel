import { Link } from "wouter";
import { Coins, MapPin, Film } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { useTranslation } from "react-i18next";

/** Inline AIT reward hints for trip planner / passport surfaces. */
export default function EconomyContextBar({ surface = "trip" }: { surface?: "trip" | "passport" }) {
  const { t } = useTranslation();

  const items =
    surface === "passport"
      ? [
          { icon: Coins, label: t("economy.fogShare", { defaultValue: "+25 AIT · share fog map" }) },
          { icon: MapPin, label: t("economy.stamp", { defaultValue: "+15 AIT · new country stamp" }) },
        ]
      : [
          { icon: MapPin, label: t("economy.checkin", { defaultValue: "+12 AIT · daily check-in" }) },
          { icon: Film, label: t("economy.cinema", { defaultValue: "+20 AIT · Trip Cinema" }) },
        ];

  return (
    <GlassCard className="px-4 py-2.5 flex flex-wrap items-center gap-3 border-ait-orange/20 bg-ait-orange/5">
      <span className="text-xs font-semibold text-ait-orange uppercase tracking-wider">AIT</span>
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-ait-purple" />
          {label}
        </span>
      ))}
      <Link href="/wallet" className="text-xs text-ait-orange hover:underline ml-auto">
        {t("economy.hub", { defaultValue: "AIT Hub →" })}
      </Link>
    </GlassCard>
  );
}
