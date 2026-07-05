import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AitSectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export default function AitSectionHeader({
  title,
  description,
  actions,
  className,
}: AitSectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-section", className)}>
      <div className="min-w-0">
        <h1 className="ait-section-title text-white">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
