import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, rightSlot, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3", className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {rightSlot ? <div className="flex-shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

