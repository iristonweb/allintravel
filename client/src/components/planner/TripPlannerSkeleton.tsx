import { Skeleton } from "@/components/ui/skeleton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { useTranslation } from "react-i18next";

export default function TripPlannerSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t("planner.loading")}>
      <div className="flex flex-wrap justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full max-w-xl rounded-full" />
      <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[480px]">
        <AitSurface padding="none" className="p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </AitSurface>
        <AitSurface padding="none" className="min-h-[420px]">
          <Skeleton className="h-full min-h-[420px] w-full rounded-[24px]" />
        </AitSurface>
      </div>
    </div>
  );
}
