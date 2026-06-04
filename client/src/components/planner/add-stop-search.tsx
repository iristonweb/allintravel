import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LocationAutocompleteInput, {
  type GeoAutocompleteItem,
} from "@/components/location-autocomplete-input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Building2 } from "lucide-react";
import type { Place } from "@shared/schema";
import { fetchDestinationSearch } from "@/lib/destination-search";

const KIND_LABEL: Record<string, string> = {
  city: "Город",
  country: "Страна",
  address: "Адрес",
  poi: "Место / заведение",
};

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
  const [query, setQuery] = useState("");
  const [selectedGeo, setSelectedGeo] = useState<GeoAutocompleteItem | null>(null);
  const debouncedQ = useDebounced(query, 280);

  const { data: catalog } = useQuery({
    queryKey: ["destination-catalog", debouncedQ],
    queryFn: () => fetchDestinationSearch(debouncedQ, { limit: 8 }),
    enabled: debouncedQ.length >= 2,
  });

  const catalogPlaces = (catalog?.places ?? []).filter((p) => !existingPlaceIds.has(p.id));

  const canAddGeo =
    selectedGeo != null &&
    selectedGeo.lat != null &&
    selectedGeo.lon != null &&
    Number.isFinite(Number(selectedGeo.lat)) &&
    Number.isFinite(Number(selectedGeo.lon));

  return (
    <div className="space-y-3">
      <LocationAutocompleteInput
        placeholder="Город, адрес, улица или заведение…"
        value={query}
        onChange={(v) => {
          setQuery(v);
          setSelectedGeo(null);
        }}
        onSelectItem={(item) => {
          setQuery(item.label);
          setSelectedGeo(item);
        }}
        scope="full"
        limit={12}
        debounceMs={280}
      />

      {canAddGeo && (
        <Button
          type="button"
          variant="premium"
          className="w-full"
          disabled={adding}
          onClick={() => onAddLocation(selectedGeo!)}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
          Добавить «{selectedGeo!.label.split(",")[0]}»
        </Button>
      )}

      {debouncedQ.length >= 2 && catalogPlaces.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">Из каталога All In Travel</p>
          {catalogPlaces.map((place) => (
            <CatalogPlaceRow
              key={place.id}
              place={place}
              disabled={adding}
              onAdd={() => onAddPlace(place.id)}
            />
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
        Подсказки: OpenStreetMap (Photon + Nominatim) — бесплатно; при наличии ключей Яндекс — точнее по РФ.
        Полная база улиц и заведений локально не хранится — только города (GeoNames) и ваш каталог мест.
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

export { KIND_LABEL };
