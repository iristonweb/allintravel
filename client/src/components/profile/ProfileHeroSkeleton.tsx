import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileHeroSkeleton() {
  return (
    <AitSurface className="mb-6" aria-busy="true">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <Skeleton className="h-8 w-64 max-w-full" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </AitSurface>
  );
}
