import { Button } from "@/components/ui/button";
import DestinationSearch from "@/components/search/DestinationSearch";
import { MAP_PLACE_TYPE_FILTERS } from "@/lib/filter-config";
import { cn } from "@/lib/utils";

const placeTypes = MAP_PLACE_TYPE_FILTERS.map((f) => f.value) as readonly string[];
const typeLabels = Object.fromEntries(
  MAP_PLACE_TYPE_FILTERS.map((f) => [f.value, f.label]),
) as Record<string, string>;

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
  return (
    <div className={cn("pointer-events-auto max-w-2xl w-full", className)}>
      <div className="ait-glass-strong rounded-2xl p-3 md:p-4 ait-gradient-border shadow-2xl">
        <h1 className="text-lg md:text-xl font-bold text-white mb-3">Интерактивная карта</h1>
        <div className="flex flex-col gap-3">
          <DestinationSearch
            value={search}
            onChange={onSearchChange}
            onNavigate={onNavigate}
            placeholder="Город, страна или место"
            inputClassName="ait-glass-strong border-0 bg-transparent text-white placeholder:text-slate-500"
            placeType={filterType}
            hrefMode="map"
            dropdownPortal
          />
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {placeTypes.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? "default" : "secondary"}
                onClick={() => onFilterTypeChange(type)}
                className={cn(
                  "rounded-full text-xs font-medium shrink-0",
                  filterType === type
                    ? "ait-btn-glow border-0 text-white"
                    : "ait-glass border-white/10 bg-transparent text-slate-300 hover:text-white",
                )}
              >
                {typeLabels[type]}
              </Button>
            ))}
          </div>
          {showPlacesHint && (
            <p className="text-xs text-slate-400 px-1">
              Места по запросу не найдены — карта показывает выбранный город
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { placeTypes, typeLabels };
