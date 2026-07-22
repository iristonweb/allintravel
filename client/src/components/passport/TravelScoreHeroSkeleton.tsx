import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";

export default function TravelScoreHeroSkeleton() {
  return (
    <AitSurface padding="md" radius="card" aria-busy="true">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:justify-between">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </AitSurface>
  );
}
