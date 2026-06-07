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
    <div className={cn("pointer-events-auto w-full max-w-4xl xl:max-w-5xl", className)}>
      <div className="ait-glass-strong rounded-2xl p-3 md:p-4 ait-gradient-border shadow-2xl">
        <h1 className="text-lg md:text-xl font-bold text-white mb-3">Интерактивная карта</h1>
        <div className="flex flex-col gap-3">
          <DestinationSearch
            value={search}
            onChange={onSearchChange}
            onNavigate={onNavigate}
            placeholder="Город, заведение или адрес…"
            showLeadingIcon={false}
            inputClassName="ait-glass border-0 bg-white/5 text-white placeholder:text-slate-500 h-11 text-sm truncate"
            placeType={filterType}
            hrefMode="map"
            dropdownPortal
          />
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {placeTypes.map((type) => (
              <Button
                key={type}
                size="sm"
                variant="filter"
                onClick={() => onFilterTypeChange(type)}
                className={cn(
                  filterType === type &&
                    "ait-btn-glow border-0 text-white shadow-none hover:text-white",
                )}
              >
                {typeLabels[type]}
              </Button>
            ))}
          </div>
          {showPlacesHint && (
            <p className="text-xs text-slate-400 px-1">
              В каталоге ничего не найдено — показаны заведения из OpenStreetMap по запросу или
              точка на карте
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { placeTypes, typeLabels };
