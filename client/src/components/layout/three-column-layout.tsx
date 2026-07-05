import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type ThreeColumnMaxWidth = "feed" | "wide" | "full";

type ThreeColumnLayoutProps = {
  children: ReactNode;
  rightRail?: ReactNode;
  rightRailSticky?: boolean;
  maxWidth?: ThreeColumnMaxWidth;
  className?: string;
  centerClassName?: string;
  rightClassName?: string;
};

const maxWidthMap: Record<ThreeColumnMaxWidth, string> = {
  feed: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none w-full",
};

export default function ThreeColumnLayout({
  children,
  rightRail,
  rightRailSticky = true,
  maxWidth = "wide",
  className,
  centerClassName,
  rightClassName,
}: ThreeColumnLayoutProps) {
  if (!rightRail) {
    return (
      <div className={cn("w-full mx-auto px-4 sm:px-6 lg:px-8", maxWidthMap[maxWidth], className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_min(320px,28vw)] gap-8",
        maxWidth === "full" ? "max-w-[1600px]" : "max-w-[1600px]",
        className,
      )}
    >
      <div className={cn(maxWidthMap[maxWidth], "min-w-0 mx-auto xl:mx-0 w-full", centerClassName)}>
        {children}
      </div>
      <aside
        className={cn(
          "hidden xl:block min-w-0",
          rightRailSticky && "sticky top-[calc(var(--ait-header-h)+1.5rem)] self-start max-h-[calc(100vh-var(--ait-header-h)-2rem)] overflow-y-auto ait-scrollbar",
          rightClassName,
        )}
      >
        <div className="space-y-6 pb-8">{rightRail}</div>
      </aside>
    </div>
  );
}
