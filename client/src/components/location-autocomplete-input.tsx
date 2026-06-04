import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type GeoAutocompleteItem = {
  label: string;
  kind?: "city" | "country" | "address" | "poi";
  countryCode?: string;
  geonameId?: number;
  lat?: number | null;
  lon?: number | null;
  population?: number;
  city?: string | null;
  country?: string | null;
  osmId?: number | null;
  osmType?: string | null;
};

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onSelectItem?: (item: GeoAutocompleteItem) => void;
  debounceMs?: number;
  limit?: number;
  scope?: "city" | "country" | "all" | "full";
  /** Render suggestions in document.body (use inside Dialog / overflow containers). */
  dropdownPortal?: boolean;
};

const KIND_LABELS: Record<string, string> = {
  city: "Город",
  country: "Страна",
  address: "Адрес",
  poi: "Заведение",
};

export const LocationAutocompleteInput = React.forwardRef<HTMLInputElement, Props>(
  function LocationAutocompleteInput(
    {
      value,
      onChange,
      onSelectItem,
      debounceMs = 300,
      limit = 8,
      scope = "all",
      className,
      disabled,
      dropdownPortal = false,
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
    const anchorRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

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

          if (lastIssuedRef.current !== issuedAt) return;
          setItems(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
          if (e instanceof Error && e.name === "AbortError") return;
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
          top: rect.bottom + 4,
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
    }, [dropdownPortal, open, value, items.length, loading, error]);

    const showDropdown =
      open &&
      !disabled &&
      (loading || !!error || items.length > 0 || (shouldQuery && !loading));

    const portalReady = !dropdownPortal || dropdownStyle != null;

    const dropdownContent = showDropdown && portalReady ? (
      <div
        data-geo-autocomplete
        className={cn(
          "rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden",
          dropdownPortal ? "fixed z-[200]" : "absolute left-0 right-0 top-[calc(100%+4px)] z-50",
        )}
        style={
          dropdownPortal && dropdownStyle
            ? { top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }
            : undefined
        }
        onMouseDown={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-64">
            {loading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Загрузка…</div>
            )}
            {!loading && error && (
              <div className="px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            {!loading && !error && items.length === 0 && shouldQuery && (
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
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange(item.label);
                    onSelectItem?.(item);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">{item.label}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {[item.kind ? KIND_LABELS[item.kind] ?? item.kind : null, item.city, item.country]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </div>
    ) : null;

    return (
      <div ref={anchorRef} className={cn("relative w-full")}>
        <Input
          {...rest}
          ref={ref}
          disabled={disabled}
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            rest.onFocus?.(e);
            setOpen(true);
          }}
          onBlur={(e) => {
            rest.onBlur?.(e);
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            rest.onKeyDown?.(e);
            if (e.key === "Escape") setOpen(false);
          }}
          className={cn(className)}
        />
        {!dropdownPortal && dropdownContent}
        {dropdownPortal &&
          dropdownContent &&
          dropdownStyle &&
          createPortal(dropdownContent, document.body)}
      </div>
    );
  },
);

export default LocationAutocompleteInput;
