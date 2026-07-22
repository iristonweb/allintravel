import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function FogMapSkeleton() {
  const { t } = useTranslation();
  return (
    <AitSurface
      padding="md"
      radius="card"
      aria-busy="true"
      aria-label={t("passport.loadingMap", { defaultValue: "Loading travel map" })}
    >
      <Skeleton className="h-5 w-36 mb-4" />
      <Skeleton className="h-40 sm:h-44 rounded-card-xl w-full" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </AitSurface>
  );
}
