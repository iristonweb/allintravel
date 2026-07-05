import { cn } from "@/lib/utils";

type StoriesStripSkeletonProps = {
  count?: number;
  className?: string;
};

export default function StoriesStripSkeleton({ count = 8, className }: StoriesStripSkeletonProps) {
  return (
    <div className={cn("mb-section", className)}>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[82px] h-[132px] rounded-[24px] bg-white/10 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
