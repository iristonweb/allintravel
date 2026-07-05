import { useMemo } from "react";
import { Film, Globe, MapPin, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import AitStatCard from "@/components/ait-ui/AitStatCard";
import { staggerContainer, staggerItem } from "@/lib/ait-motion";
import { useTranslation } from "react-i18next";

type CommunityStatsRowProps = {
  reelsCount?: number;
};

function formatReelsCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

export default function CommunityStatsRow({ reelsCount = 0 }: CommunityStatsRowProps) {
  const { t } = useTranslation();

  const stats = useMemo(
    () => [
      { value: "196", label: t("marketing.stats.countries", { defaultValue: "Countries" }), icon: Globe },
      { value: "25K+", label: t("marketing.stats.places", { defaultValue: "Places" }), icon: MapPin },
      { value: "1.2M", label: t("marketing.stats.travelers", { defaultValue: "Travelers" }), icon: Users },
      { value: formatReelsCount(reelsCount), label: t("marketing.stats.reels", { defaultValue: "Reels" }), icon: Film },
      { value: "4.9", label: t("marketing.stats.rating", { defaultValue: "Rating" }), icon: Star },
    ],
    [t, reelsCount],
  );

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-section"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {stats.map((s) => (
        <motion.div key={s.label} variants={staggerItem}>
          <AitStatCard value={s.value} label={s.label} icon={s.icon} />
        </motion.div>
      ))}
    </motion.div>
  );
}
