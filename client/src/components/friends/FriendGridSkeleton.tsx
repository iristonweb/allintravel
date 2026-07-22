import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";

export default function FriendGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <AitSurface key={i} padding="sm" className="flex flex-col items-center gap-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </AitSurface>
      ))}
    </div>
  );
}
