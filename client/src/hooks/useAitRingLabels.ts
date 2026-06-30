import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ActivityRingId } from "@shared/ait";

export function useAitRingLabels(): Record<ActivityRingId, string> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      voice: t("ait.rings.voice"),
      story: t("ait.rings.story"),
      echo: t("ait.rings.echo"),
      pulse: t("ait.rings.pulse"),
    }),
    [t],
  );
}
