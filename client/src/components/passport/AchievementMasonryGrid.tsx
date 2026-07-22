import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import AitSurface from "@/components/ait-ui/AitSurface";
import { staggerContainer, staggerItem } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type AchievementMasonryGridProps = {
  achievements: { id: string; label: string }[];
  className?: string;
};

export default function AchievementMasonryGrid({
  achievements,
  className,
}: AchievementMasonryGridProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  if (achievements.length === 0) return null;

  return (
    <motion.div
      className={cn("columns-2 sm:columns-3 gap-4", className)}
      variants={reduceMotion ? undefined : staggerContainer}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "visible"}
    >
      {achievements.map((achievement) => (
        <motion.div
          key={achievement.id}
          className="break-inside-avoid mb-4"
          variants={reduceMotion ? undefined : staggerItem}
        >
          <AitSurface
            padding="sm"
            radius="lg"
            hover
            className="flex items-start gap-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ait-purple/20">
              <Trophy className="h-4 w-4 text-ait-purple" strokeWidth={1.5} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">{achievement.label}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                {t("passport.achievementUnlocked", { defaultValue: "Unlocked" })}
              </p>
            </div>
          </AitSurface>
        </motion.div>
      ))}
    </motion.div>
  );
}
