import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type GeoAutocompleteItem = {
  label: string;
  // DB-backed fields
  kind?: "city" | "country";
  countryCode?: string;
  geonameId?: number;
  lat?: number | null;
  lon?: number | null;
  population?: number;
  // Convenience (present for city results from DB and for Nominatim)
  city?: string | null;
  country?: string | null;
  // Nominatim identity fields (fallback mode)
  osmId?: number | null;
  osmType?: string | null;
};

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onSelectItem?: (item: GeoAutocompleteItem) => void;
  /** Debounce delay before querying server. Default: 300ms. */
  debounceMs?: number;
  /** Max suggestions. Default: 8. */
  limit?: number;
  /** Search scope. Default: all. */
  scope?: "city" | "country" | "all";
};

export const LocationAutocompleteInput = React.forwardRef<HTMLInputElement, Props>(function LocationAutocompleteInput(
  {
    value,
    onChange,
    onSelectItem,
    debounceMs = 300,
    limit = 8,
    scope = "all",
    className,
    disabled,
    ...rest
  }: Props,
  ref,
) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GeoAutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastIssuedRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const q = value.trim();
  const shouldQuery = q.length >= 2 && !disabled;

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams({ q, limit: String(limit), scope });
    return `/api/geo/autocomplete?${params.toString()}`;
  }, [q, limit, scope]);

  useEffect(() => {
    if (!shouldQuery) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const issuedAt = Date.now();
    lastIssuedRef.current = issuedAt;

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(queryUrl, { credentials: "include", signal: ctrl.signal });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || String(res.status));
        }
        const data = (await res.json()) as GeoAutocompleteItem[];

        // Ignore out-of-order responses.
        if (lastIssuedRef.current !== issuedAt) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (lastIssuedRef.current !== issuedAt) return;
        setItems([]);
        setError("Не удалось загрузить подсказки");
      } finally {
        if (lastIssuedRef.current === issuedAt) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shouldQuery, queryUrl, debounceMs]);

  const showPopover = open && !disabled && (loading || !!error || items.length > 0);

  return (
    <Popover open={showPopover} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Input
          {...rest}
          ref={ref}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={(e) => {
            rest.onFocus?.(e);
            setOpen(true);
          }}
          onBlur={(e) => {
            rest.onBlur?.(e);
            // Let click selection happen before closing.
            window.setTimeout(() => setOpen(false), 120);
          }}
          className={cn(className)}
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-64">
            {loading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Загрузка…</div>
            )}
            {!loading && error && <div className="px-3 py-2 text-sm text-destructive">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <CommandEmpty className="py-4">Ничего не найдено</CommandEmpty>
            )}
            {!loading &&
              !error &&
              items.map((item) => (
                <CommandItem
                  key={
                    item.kind === "city" && item.geonameId
                      ? `city:${item.geonameId}`
                      : item.kind === "country" && item.countryCode
                        ? `country:${item.countryCode}`
                        : `${item.osmType ?? "x"}:${item.osmId ?? item.label}`
                  }
                  value={item.label}
                  onMouseDown={(e) => {
                    // Prevent input blur before selection.
                    e.preventDefault();
                  }}
                  onSelect={() => {
                    onChange(item.label);
                    onSelectItem?.(item);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="truncate">{item.label}</span>
                    {(item.city || item.country) && (
                      <span className="text-xs text-muted-foreground truncate">
                        {[item.city, item.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default LocationAutocompleteInput;

