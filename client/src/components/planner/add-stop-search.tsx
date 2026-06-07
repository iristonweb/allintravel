import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LocationAutocompleteInput, {
  type GeoAutocompleteItem,
} from "@/components/location-autocomplete-input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Building2 } from "lucide-react";
import type { Place } from "@shared/schema";
import { fetchDestinationSearch } from "@/lib/destination-search";
import { geoItemHasCoords, geocodeGeoQuery, resolveGeoFromQuery } from "@/lib/trip-waypoints";
import { useToast } from "@/hooks/use-toast";

type AddStopSearchProps = {
  existingPlaceIds: Set<string>;
  onAddPlace: (placeId: string) => void;
  onAddLocation: (item: GeoAutocompleteItem) => Promise<void>;
  adding: boolean;
};

export default function AddStopSearch({
  existingPlaceIds,
  onAddPlace,
  onAddLocation,
  adding,
}: AddStopSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedGeo, setSelectedGeo] = useState<GeoAutocompleteItem | null>(null);
  const [resolving, setResolving] = useState(false);

  const debouncedQ = useDebounced(query, 320);

  const { data: catalog } = useQuery({
    queryKey: ["destination-catalog", debouncedQ],
    queryFn: () => fetchDestinationSearch(debouncedQ, { limit: 8 }),
    enabled: debouncedQ.length >= 2,
  });

  const catalogPlaces = (catalog?.places ?? []).filter((p) => !existingPlaceIds.has(p.id));
  const canAdd = query.trim().length >= 2;

  const pickSuggestion = (item: GeoAutocompleteItem) => {
    setQuery(item.label);
    setSelectedGeo(item);
  };

  const handleAddToRoute = async () => {
    const q = query.trim();
    if (q.length < 2) return;

    setResolving(true);
    try {
      let item: GeoAutocompleteItem | null =
        selectedGeo && geoItemHasCoords(selectedGeo) ? selectedGeo : null;

      if (!item && selectedGeo?.label) {
        item = await geocodeGeoQuery(selectedGeo.label);
      }
      if (!item) {
        item = await resolveGeoFromQuery(q, { scope: "full" });
      }
      if (!item || !geoItemHasCoords(item)) {
        toast({
          title: "Не удалось определить координаты",
          description: "Выберите пункт из списка подсказок или уточните адрес (улица, дом, город).",
          variant: "destructive",
        });
        return;
      }

      await onAddLocation(item);
      setQuery("");
      setSelectedGeo(null);
    } catch {
      toast({
        title: "Не удалось добавить остановку",
        description: "Проверьте подключение и попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const busy = adding || resolving;

  return (
    <div className="space-y-3">
      <LocationAutocompleteInput
        placeholder="Город, улица, заведение…"
        value={query}
        onChange={(v) => {
          setQuery(v);
          setSelectedGeo(null);
        }}
        onSelectItem={pickSuggestion}
        scope="full"
        limit={12}
        debounceMs={320}
        dropdownPortal
        onKeyDown={(e) => {
          if (e.key === "Enter" && canAdd && !busy) {
            e.preventDefault();
            void handleAddToRoute();
          }
        }}
      />

      {canAdd && (
        <Button
          type="button"
          variant="premium"
          className="w-full"
          disabled={busy}
          onClick={() => void handleAddToRoute()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          {selectedGeo ? `Добавить «${selectedGeo.label.split(",")[0]}»` : "Добавить в маршрут"}
        </Button>
      )}

      {debouncedQ.length >= 2 && catalogPlaces.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">Из каталога All In Travel</p>
          {catalogPlaces.map((place) => (
            <CatalogPlaceRow
              key={place.id}
              place={place}
              disabled={busy}
              onAdd={() => onAddPlace(place.id)}
            />
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
        Можно добавить город целиком (например, «Владикавказ») — координаты подставятся
        автоматически. Для точного адреса выберите подсказку из списка.
      </p>
    </div>
  );
}

function CatalogPlaceRow({
  place,
  onAdd,
  disabled,
}: {
  place: Place;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 min-w-0">
        <Building2 className="h-4 w-4 text-ait-orange shrink-0" />
        <span className="text-sm font-medium truncate">{place.name}</span>
      </div>
      <Button size="sm" variant="premium" disabled={disabled} onClick={onAdd}>
        +
      </Button>
    </div>
  );
}

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
