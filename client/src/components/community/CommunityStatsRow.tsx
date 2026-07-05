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
  useMarketingStats = false,
}: CommunityStatsRowProps) {
  const { t } = useTranslation();

  const stats = useMemo(
    () => [
      {
        value: DEMO_STATS.countries,
        label: t("marketing.stats.countries", { defaultValue: "Countries" }),
        icon: Globe,
      },
      {
        value: useMarketingStats ? DEMO_STATS.places : "42K",
        label: t("marketing.stats.places", { defaultValue: "Places" }),
        icon: MapPin,
      },
      {
        value: DEMO_STATS.travelers,
        label: t("marketing.stats.travelers", { defaultValue: "Travelers" }),
        icon: Users,
      },
      {
        value:
          displayReelsCount ??
          (useMarketingStats ? DEMO_STATS.reels : formatReelsCount(reelsCount)),
        label: t("marketing.stats.reels", { defaultValue: "Reels" }),
        icon: Film,
      },
      {
        value: DEMO_STATS.rating,
        label: t("marketing.stats.rating", { defaultValue: "Rating" }),
        icon: Star,
      },
    ],
    [t, reelsCount, displayReelsCount, useMarketingStats],
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
            className="h-full min-h-[88px]"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
