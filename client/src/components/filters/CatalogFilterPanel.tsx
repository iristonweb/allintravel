import { Button } from "@/components/ui/button";
import FilterChipRow from "@/components/filters/FilterChipRow";
import type { FilterOption } from "@/lib/filter-config";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export type CatalogFilterRow = {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
};

type CatalogFilterPanelProps = {
  rows: CatalogFilterRow[];
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
};

export default function CatalogFilterPanel({
  rows,
  onClear,
  showClear = true,
  className,
}: CatalogFilterPanelProps) {
  const { t } = useTranslation();

  const hasActive = rows.some(
    (row) => row.value !== "" && row.value !== "all" && row.value !== "upcoming",
  );

  return (
    <div className={cn("space-y-0", className)}>
      <div className="flex items-center justify-between gap-3 pb-3 mb-1 border-b border-white/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-ait-purple" />
          {t("filters.panelTitle")}
        </div>
        {showClear && hasActive && onClear ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            {t("filters.clearAll")}
          </Button>
        ) : null}
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <FilterChipRow
            key={row.label}
            label={row.label}
            icon={row.icon}
            options={row.options}
            value={row.value}
            onChange={row.onChange}
            className="py-3 first:pt-2 last:pb-1"
          />
        ))}
      </div>
    </div>
  );
}
