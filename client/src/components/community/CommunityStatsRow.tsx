import { useMemo } from "react";
import { Film, Globe, MapPin, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import AitStatCard from "@/components/ait-ui/AitStatCard";
import { staggerContainer, staggerItem } from "@/lib/ait-motion";
import { DEMO_STATS } from "@/lib/demo-reels-feed";
import { useTranslation } from "react-i18next";

type CommunityStatsRowProps = {
  reelsCount?: number;
  displayReelsCount?: string;
  useMarketingStats?: boolean;
};

function formatReelsCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

export default function CommunityStatsRow({
  reelsCount = 0,
  displayReelsCount,
  useMarketingStats = true,
}: CommunityStatsRowProps) {
  const { t } = useTranslation();
  const empty = "—";

  const reelsValue =
    displayReelsCount ??
    (reelsCount > 0 ? formatReelsCount(reelsCount) : useMarketingStats ? DEMO_STATS.reels : empty);

  const stats = useMemo(
    () => [
      {
        value: useMarketingStats ? DEMO_STATS.countries : empty,
        label: t("marketing.stats.countries"),
        icon: Globe,
        iconClassName: "bg-ait-purple/20",
      },
      {
        value: useMarketingStats ? DEMO_STATS.places : empty,
        label: t("marketing.stats.places"),
        icon: MapPin,
        iconClassName: "bg-ait-purple/20",
      },
      {
        value: useMarketingStats ? DEMO_STATS.travelers : empty,
        label: t("marketing.stats.travelers"),
        icon: Users,
        iconClassName: "bg-ait-orange/20 [&_svg]:text-ait-orange",
      },
      {
        value: reelsValue,
        label: t("marketing.stats.reels"),
        icon: Film,
        iconClassName: "bg-ait-purple/20",
      },
      {
        value: useMarketingStats ? DEMO_STATS.rating : empty,
        label: t("marketing.stats.rating"),
        icon: Star,
        iconClassName: "bg-amber-500/20 [&_svg]:text-amber-400",
      },
    ],
    [t, reelsValue, useMarketingStats, empty],
  );

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-section"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {stats.map((s) => (
        <motion.div key={s.label} variants={staggerItem} className="min-h-[88px]">
          <AitStatCard
            value={s.value}
            label={s.label}
            icon={s.icon}
            iconClassName={s.iconClassName}
            className="h-full min-h-[88px]"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
