import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Globe, Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { GeoAutocompleteItem } from "@/components/location-autocomplete-input";
import {
  buildDestinationHref,
  fetchDestinationSearch,
  type DestinationHrefMode,
  type DestinationPick,
} from "@/lib/destination-search";

const POPULAR = [
  "Стамбул",
  "Париж",
  "Токио",
  "Бали",
  "Барселона",
  "Дубай",
  "Москва",
  "Киото",
] as const;

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

type DestinationSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onNavigate: (href: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  placeType?: string;
  hrefMode?: DestinationHrefMode;
  dropdownPortal?: boolean;
  showSubmit?: boolean;
  showPopular?: boolean;
  showLeadingIcon?: boolean;
  debounceMs?: number;
  minChars?: number;
};

export default function DestinationSearch({
  value,
  onChange,
  onNavigate,
  placeholder = "Страна, город или место…",
  className,
  inputClassName,
  placeType,
  hrefMode = "default",
  dropdownPortal = false,
  showSubmit = true,
  showPopular = true,
  showLeadingIcon = true,
  debounceMs = 280,
  minChars = 2,
}: DestinationSearchProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<GeoAutocompleteItem[]>([]);
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof fetchDestinationSearch>>["places"]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const q = value.trim();
  const debouncedQ = useDebounced(q, debounceMs);
  const shouldFetch = debouncedQ.length >= minChars;

  useEffect(() => {
    if (!shouldFetch) {
      setLocations([]);
      setPlaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);

    fetchDestinationSearch(debouncedQ, { placeType })
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setLocations(data.locations ?? []);
        setPlaces(data.places ?? []);
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setLocations([]);
        setPlaces([]);
        setError("Не удалось выполнить поиск");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [debouncedQ, shouldFetch, placeType]);

  const go = (pick: DestinationPick) => {
    onNavigate(buildDestinationHref(pick, placeType, hrefMode));
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!dropdownPortal || !open || !anchorRef.current) {
      setDropdownStyle(null);
      return;
    }
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [dropdownPortal, open, value, locations.length, places.length, loading]);

  const submitText = () => go({ type: "text", query: q });

  const showDropdown =
    open && (showPopular && !q || loading || error || locations.length > 0 || places.length > 0);

  const locationIcon = (item: GeoAutocompleteItem) =>
    item.kind === "country" ? (
      <Globe className="h-4 w-4 shrink-0 text-ait-cyan" />
    ) : (
      <MapPin className="h-4 w-4 shrink-0 text-ait-purple" />
    );

  const dropdownContent = showDropdown ? (
    <div
      className={cn(
        "ait-glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden",
        dropdownPortal ? "fixed z-[60]" : "absolute left-0 right-0 top-[calc(100%+6px)] z-50",
      )}
      style={
        dropdownPortal && dropdownStyle
          ? {
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              maxHeight: "min(360px, calc(100vh - 7rem - env(safe-area-inset-bottom, 0px)))",
            }
          : undefined
      }
    >
      <Command shouldFilter={false}>
        <CommandList className="max-h-[min(360px,calc(100vh-8rem))] overflow-y-auto">
          {showPopular && !q && (
            <CommandGroup heading="Популярные направления">
              {POPULAR.map((d) => (
                <CommandItem
                  key={d}
                  value={d}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange(d);
                    go({ type: "text", query: d });
                  }}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {d}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ищем города и места…
            </div>
          )}

          {!loading && error && (
            <div className="px-3 py-3 text-sm text-destructive">{error}</div>
          )}

          {!loading && !error && shouldFetch && locations.length > 0 && (
            <CommandGroup heading="Города и страны">
              {locations.map((item) => (
                <CommandItem
                  key={
                    item.geonameId
                      ? `city-${item.geonameId}`
                      : item.countryCode
                        ? `country-${item.countryCode}`
                        : `loc-${item.label}`
                  }
                  value={item.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange(item.label);
                    go({ type: "location", item });
                  }}
                >
                  {locationIcon(item)}
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {item.kind === "country" ? "Страна" : "Город"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && !error && shouldFetch && places.length > 0 && (
            <CommandGroup heading="Места в каталоге">
              {places.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange(p.name);
                    go({ type: "place", place: p });
                  }}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-ait-orange" />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.address && (
                    <span className="text-xs text-muted-foreground truncate max-w-[40%]">
                      {p.address}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && !error && shouldFetch && locations.length === 0 && places.length === 0 && (
            <CommandEmpty className="py-4 text-sm text-muted-foreground">
              Ничего не найдено. Попробуйте другое название или латиницу.
            </CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  ) : null;

  return (
    <div className={cn("relative", className)} ref={anchorRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          {showLeadingIcon && (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            value={value}
            placeholder={placeholder}
            autoComplete="off"
            className={cn(showLeadingIcon ? "pl-9 pr-3" : "pl-3 pr-3", inputClassName)}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitText();
              if (e.key === "Escape") setOpen(false);
            }}
          />
        </div>
        {showSubmit && (
          <Button
            type="button"
            variant="premium"
            className="shrink-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={submitText}
            disabled={!q}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
          </Button>
        )}
      </div>

      {!dropdownPortal && dropdownContent}
      {dropdownPortal && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
