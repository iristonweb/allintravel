import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/lib/filter-config";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

type FilterChipRowProps = {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  icon?: LucideIcon;
  className?: string;
};

export default function FilterChipRow({
  label,
  options,
  value,
  onChange,
  onClear,
  showClear,
  icon: Icon,
  className,
}: FilterChipRowProps) {
  const { t } = useTranslation();
  const hasActive = value !== "" && value !== "all" && value !== "upcoming";

  return (
    <div className={cn("ait-filter-row", className)}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 shrink-0">
        {Icon ? <Icon className="h-3.5 w-3.5 text-ait-purple/80" /> : null}
        {label}
      </span>
      <div className="min-w-0 flex items-center gap-2">
        <div className="ait-filter-chips flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <Button
                key={opt.value || "__all"}
                type="button"
                size="sm"
                variant={active ? "premium" : "filter"}
                className={cn(!active && "hover:border-ait-purple/30")}
                onClick={() => onChange(opt.value)}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
        {showClear && hasActive && onClear ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
            onClick={onClear}
          >
            <X className="h-3 w-3 mr-1" />
            {t("common.reset")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
