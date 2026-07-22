import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaceDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-64 md:h-96 w-full rounded-card-xl" />
      <AitSurface className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full rounded-card-lg" />
      </AitSurface>
      <AitSurface className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </AitSurface>
    </div>
  );
}
