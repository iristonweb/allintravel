import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type AitStatCardProps = {
  value: string;
  label: string;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
};

export default function AitStatCard({
  value,
  label,
  icon: Icon,
  iconClassName,
  className,
}: AitStatCardProps) {
  return (
    <AitSurface
      padding="sm"
      radius="lg"
      hover
      className={cn("text-center min-w-0 transition-all duration-200", className)}
    >
      {Icon && (
        <div
          className={cn(
            "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-ait-purple/20",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4 text-ait-purple" aria-hidden />
        </div>
      )}
      <p className="text-xl font-bold tracking-tight text-white">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
    </AitSurface>
  );
}
