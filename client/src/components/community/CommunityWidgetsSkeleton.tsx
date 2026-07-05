import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";

type CommunityWidgetsSkeletonProps = {
  className?: string;
};

export default function CommunityWidgetsSkeleton({ className }: CommunityWidgetsSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="h-[200px] rounded-card-lg bg-white/10 animate-pulse" />
      <AitSurface padding="md" radius="lg" className="space-y-3">
        <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-2">
            <div className="h-3 flex-1 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-10 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </AitSurface>
      <div className="aspect-[4/3] rounded-card-lg bg-white/10 animate-pulse" />
    </div>
  );
}
