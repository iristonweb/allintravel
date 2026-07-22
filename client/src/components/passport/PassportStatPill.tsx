import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PassportStatPillProps = {
  icon: LucideIcon;
  value: number;
  label: string;
  className?: string;
};

export default function PassportStatPill({
  icon: Icon,
  value,
  label,
  className,
}: PassportStatPillProps) {
  return (
    <div
      className={cn(
        "rounded-card-lg bg-card border border-border/50 p-3 sm:p-4 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]",
        className,
      )}
    >
      <Icon className="h-5 w-5 mx-auto text-ait-orange mb-2" strokeWidth={1.5} aria-hidden />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}
