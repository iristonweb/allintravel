import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";

type FeedSkeletonProps = {
  count?: number;
  className?: string;
};

export default function FeedSkeleton({ count = 2, className }: FeedSkeletonProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <AitSurface key={i} padding="none" radius="lg" className="overflow-hidden">
          <div className="p-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-full ait-gradient-shimmer opacity-30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-white/10 ait-gradient-shimmer opacity-20" />
              <div className="h-3 w-24 rounded-full bg-white/5" />
            </div>
          </div>
          <div className="px-card pb-4 space-y-3">
            <div className="h-5 w-3/4 rounded-lg bg-white/10" />
            <div className="h-4 w-full rounded-lg bg-white/5" />
            <div className="h-4 w-5/6 rounded-lg bg-white/5" />
          </div>
          <div className="h-72 md:h-96 bg-white/[0.03] ait-gradient-shimmer opacity-10" />
        </AitSurface>
      ))}
    </div>
  );
}
