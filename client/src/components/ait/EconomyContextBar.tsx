import { Link } from "wouter";
import { Coins, MapPin, Film } from "lucide-react";
import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/** Inline AIT reward hints for trip planner / passport surfaces. */
export default function EconomyContextBar({ surface = "trip" }: { surface?: "trip" | "passport" }) {
  const { t } = useTranslation();

  const items =
    surface === "passport"
      ? [
          {
            icon: Coins,
            label: t("economy.fogShare"),
          },
          {
            icon: MapPin,
            label: t("economy.stamp"),
          },
        ]
      : [
          {
            icon: MapPin,
            label: t("economy.checkin"),
          },
          { icon: Film, label: t("economy.cinema") },
        ];

  return (
    <AitSurface
      padding="sm"
      radius="card"
      className="border-ait-orange/20 bg-ait-orange/5 flex flex-wrap sm:flex-nowrap items-center gap-3"
    >
      <span className="text-xs font-medium text-ait-orange uppercase tracking-wider shrink-0">
        AIT
      </span>
      <div
        className={cn(
          "flex flex-1 items-center gap-2 min-w-0",
          "overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap",
        )}
      >
        {items.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0 rounded-full bg-card border border-border/50 px-3 py-1.5"
          >
            <Icon className="h-3.5 w-3.5 text-ait-purple" strokeWidth={1.5} aria-hidden />
            {label}
          </span>
        ))}
      </div>
      <Link
        href="/wallet"
        className="text-xs text-ait-orange hover:underline shrink-0 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 rounded-sm"
      >
        {t("economy.hub")}
      </Link>
    </AitSurface>
  );
}
