import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      {Icon ? <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> : null}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description ? <p className="text-muted-foreground mb-4">{description}</p> : null}
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
