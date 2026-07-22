import FogMapSkeleton from "@/components/passport/FogMapSkeleton";
import PassportCardSkeleton from "@/components/passport/PassportCardSkeleton";
import TravelScoreHeroSkeleton from "@/components/passport/TravelScoreHeroSkeleton";
import { useTranslation } from "react-i18next";

/** Full passport page loading state (standalone / dev preview). */
export default function PassportPageSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="space-y-section"
      aria-busy="true"
      aria-label={t("passport.loading", { defaultValue: "Loading passport" })}
    >
      <TravelScoreHeroSkeleton />
      <PassportCardSkeleton />
      <FogMapSkeleton />
    </div>
  );
}
