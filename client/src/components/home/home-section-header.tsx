import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type HomeSectionHeaderProps = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
  className?: string;
};

export default function HomeSectionHeader({
  title,
  description,
  rightSlot,
  className,
}: HomeSectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="ait-section-title">{title}</h2>
        {description ? <p className="text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {rightSlot ? <div className="flex-shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

