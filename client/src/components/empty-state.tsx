import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import GlassCard from "@/components/brand/glass-card";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "compact";
};

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const content = (
    <>
      {Icon ? (
        <Icon
          className={cn(
            "mx-auto text-muted-foreground mb-3",
            variant === "compact" ? "h-8 w-8 mb-2" : "h-12 w-12 mb-4",
          )}
        />
      ) : null}
      <h3 className={cn("font-semibold mb-1", variant === "compact" ? "text-sm" : "text-lg mb-2")}>
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground",
            variant === "compact" ? "text-xs mb-2" : "mb-4",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="flex justify-center">{action}</div> : null}
    </>
  );

  if (variant === "glass") {
    return (
      <GlassCard className={cn("py-12 text-center", className)}>{content}</GlassCard>
    );
  }

  return (
    <div
      className={cn(
        "text-center",
        variant === "compact" ? "py-6 px-2" : "py-16",
        className,
      )}
    >
      {content}
    </div>
  );
}
