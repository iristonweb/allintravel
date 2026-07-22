import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching PassportCard dimensions only (no hero / map). */
export default function PassportCardSkeleton() {
  return (
    <AitSurface padding="md" radius="card" className="space-y-6" aria-busy="true">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-card-lg" />
        <Skeleton className="h-24 rounded-card-lg" />
        <Skeleton className="h-24 rounded-card-lg" />
      </div>
      <div className="columns-2 sm:columns-3 gap-4">
        <Skeleton className="h-20 rounded-card-lg mb-4 break-inside-avoid" />
        <Skeleton className="h-16 rounded-card-lg mb-4 break-inside-avoid" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-card-lg" />
        ))}
      </div>
    </AitSurface>
  );
}
