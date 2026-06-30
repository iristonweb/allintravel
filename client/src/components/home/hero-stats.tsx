import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import StatPill from "@/components/brand/stat-pill";

export default function HeroStats() {
  const { t } = useTranslation();

  const stats = useMemo(
    () => [
      { value: "120+", label: t("marketing.stats.countries") },
      { value: "25K+", label: t("marketing.stats.places") },
      { value: "1.2M+", label: t("marketing.stats.travelers") },
      { value: "4.9", label: t("marketing.stats.rating") },
    ],
    [t],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s) => (
        <StatPill key={s.label} value={s.value} label={s.label} />
      ))}
    </div>
  );
}
