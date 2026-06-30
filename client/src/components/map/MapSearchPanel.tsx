import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import DestinationSearch from "@/components/search/DestinationSearch";
import { cn } from "@/lib/utils";
import { useFilterLabels } from "@/hooks/useFilterLabels";

type MapSearchPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNavigate: (href: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  showPlacesHint?: boolean;
  className?: string;
};

export default function MapSearchPanel({
  search,
  onSearchChange,
  onNavigate,
  filterType,
  onFilterTypeChange,
  showPlacesHint,
  className,
}: MapSearchPanelProps) {
  const { t } = useTranslation();
  const { mapPlaceType } = useFilterLabels();

  return (
    <div className={cn("pointer-events-auto w-full max-w-4xl xl:max-w-5xl", className)}>
      <div className="ait-glass-strong rounded-2xl p-3 md:p-4 ait-gradient-border shadow-2xl">
        <h1 className="text-lg md:text-xl font-bold text-white mb-3">{t("mapPage.title")}</h1>
        <div className="flex flex-col gap-3">
          <DestinationSearch
            value={search}
            onChange={onSearchChange}
            onNavigate={onNavigate}
            placeholder={t("mapPage.searchPlaceholder")}
            showLeadingIcon={false}
            inputClassName="h-11 text-sm truncate text-white placeholder:text-slate-500"
            placeType={filterType}
            hrefMode="map"
            dropdownPortal
          />
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mapPlaceType.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={filterType === value ? "premium" : "filter"}
                onClick={() => onFilterTypeChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {showPlacesHint && <p className="text-xs text-slate-400 px-1">{t("mapPage.osmHint")}</p>}
        </div>
      </div>
    </div>
  );
}
