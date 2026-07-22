import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function AitHubSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="max-w-6xl mx-auto space-y-6"
      aria-busy="true"
      aria-label={t("ait.hub.loading")}
    >
      <AitSurface className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-sm" />
      </AitSurface>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AitSurface className="p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </AitSurface>
          <AitSurface className="p-5">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          </AitSurface>
          <div className="grid gap-3">
            {[1, 2].map((i) => (
              <AitSurface key={i} className="p-4 flex justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-9 w-20 rounded-xl" />
              </AitSurface>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {[1, 2, 3].map((i) => (
              <AitSurface key={i} className="p-4 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </AitSurface>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
