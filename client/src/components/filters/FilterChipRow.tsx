import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/lib/filter-config";
import { X } from "lucide-react";

type FilterChipRowProps = {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
};

export default function FilterChipRow({
  label,
  options,
  value,
  onChange,
  onClear,
  showClear,
  className,
}: FilterChipRowProps) {
  const hasActive = value !== "" && value !== "all" && value !== "upcoming";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
        {label}
      </span>
      {options.map((opt) => (
        <Badge
          key={opt.value || "__all"}
          variant={value === opt.value ? "default" : "outline"}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-medium"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Badge>
      ))}
      {showClear && hasActive && onClear && (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear}>
          <X className="h-3 w-3 mr-1" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
