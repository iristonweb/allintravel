import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/lib/filter-config";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const hasActive = value !== "" && value !== "all" && value !== "upcoming";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Button
              key={opt.value || "__all"}
              type="button"
              size="sm"
              variant={active ? "premium" : "filter"}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
      {showClear && hasActive && onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-3 w-3 mr-1" />
          {t("common.reset")}
        </Button>
      )}
    </div>
  );
}
