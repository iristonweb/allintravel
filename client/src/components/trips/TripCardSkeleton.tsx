import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripCardSkeleton() {
  return (
    <AitSurface padding="none" radius="card" className="overflow-hidden" aria-busy="true">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </AitSurface>
  );
}
