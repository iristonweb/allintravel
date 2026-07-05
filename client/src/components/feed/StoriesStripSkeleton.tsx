import { cn } from "@/lib/utils";

type StoriesStripSkeletonProps = {
  count?: number;
  className?: string;
};

export default function StoriesStripSkeleton({ count = 8, className }: StoriesStripSkeletonProps) {
  return (
    <div className={cn("mb-section", className)}>
      <div className="flex gap-3 sm:gap-4 overflow-hidden pb-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-[56px]">
            <div className="w-[52px] h-[72px] rounded-[28px] bg-white/10 animate-pulse" />
            <div className="h-2.5 w-10 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
