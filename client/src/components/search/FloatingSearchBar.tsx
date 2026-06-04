import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Sparkles, UtensilsCrossed, Search, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import type { Place } from "@shared/schema";
import { saveSearchIntent } from "@/lib/searchIntent";

type SearchKind = "all" | "hotel" | "restaurant" | "attraction";

const SEARCH_KINDS: Array<{ value: SearchKind; label: string; icon: ComponentType<{ className?: string }> }> = [
  { value: "all", label: "Все", icon: MapPin },
  { value: "hotel", label: "Отели", icon: Building2 },
  { value: "restaurant", label: "Еда", icon: UtensilsCrossed },
  { value: "attraction", label: "Туры", icon: Sparkles },
];

const POPULAR_DESTINATIONS = ["Стамбул", "Барселона", "Бали", "Дубай", "Париж", "Токио"] as const;

function toPlacesHref(args: { q?: string; type?: SearchKind }) {
  const params = new URLSearchParams();
  if (args.q?.trim()) params.set("search", args.q.trim());
  if (args.type && args.type !== "all") params.set("type", args.type);
  const query = params.toString();
  return query ? `/places?${query}` : "/places";
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  // simple debounce without extra deps
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

type FloatingSearchBarProps = {
  className?: string;
  defaultQuery?: string;
  defaultKind?: SearchKind;
};

export default function FloatingSearchBar({
  className,
  defaultQuery = "",
  defaultKind = "all",
}: FloatingSearchBarProps) {
  const [, navigate] = useLocation();
  const [kind, setKind] = useState<SearchKind>(defaultKind);
  const [query, setQuery] = useState(defaultQuery);
  const [isOpen, setIsOpen] = useState(false);

  const q = query.trim();
  const debouncedQuery = useDebouncedValue(q, 220);

  const { data: places = [], isFetching } = useQuery<Place[]>({
    queryKey: [
      "/api/places",
      {
        limit: 8,
        ...(debouncedQuery && { search: debouncedQuery }),
        ...(kind !== "all" && { type: kind }),
      },
    ],
    enabled: debouncedQuery.length >= 2,
  });

  const showPopular = q.length === 0;
  const showSuggestions = isOpen && (showPopular || debouncedQuery.length >= 2);

  const placeholder = useMemo(() => {
    if (kind === "hotel") return "Где остановимся? (отель, район, город)";
    if (kind === "restaurant") return "Что попробуем? (кафе, кухня, город)";
    if (kind === "attraction") return "Что посмотрим? (место, город, тип)";
    return "Куда хотите поехать? (город, место, тип)";
  }, [kind]);

  const onSubmit = (override?: { q?: string }) => {
    const href = toPlacesHref({ q: override?.q ?? q, type: kind });
    saveSearchIntent(href);
    navigate(href);
    setIsOpen(false);
  };

  const chips = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {SEARCH_KINDS.map((k) => {
        const Icon = k.icon;
        const selected = k.value === kind;
        return (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
              selected
                ? "border-primary/30 bg-primary/10 text-foreground shadow-[0_0_0_1px_rgba(255,106,61,0.16)]"
                : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/45",
            )}
          >
            <Icon className="h-4 w-4" />
            {k.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <div className="ait-surface rounded-[24px] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 px-2 pb-2 pt-3 sm:px-3">
          {chips}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-[18px] px-2 py-2 sm:px-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-card/30">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                value={query}
                placeholder={placeholder}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit();
                  if (e.key === "Escape") setIsOpen(false);
                }}
                className="h-12 border-0 bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                variant="premium"
                size="icon"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSubmit()}
                aria-label="Поиск"
                className="h-12 w-12 rounded-[18px]"
              >
                {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
            </div>

            {showSuggestions ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40">
                <div className="ait-surface rounded-[20px] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.14)]">
                  <Command shouldFilter={false}>
                    <CommandList className="max-h-[320px]">
                      {showPopular ? (
                        <CommandGroup heading="Популярные направления">
                          {POPULAR_DESTINATIONS.map((d) => (
                            <CommandItem
                              key={d}
                              value={d}
                              onMouseDown={(e) => e.preventDefault()}
                              onSelect={() => {
                                setQuery(d);
                                onSubmit({ q: d });
                              }}
                              className="rounded-[14px]"
                            >
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{d}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <>
                          <CommandGroup heading="Подсказки">
                            {isFetching ? (
                              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Ищем варианты…
                              </div>
                            ) : null}
                            {places.slice(0, 8).map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onMouseDown={(e) => e.preventDefault()}
                                onSelect={() => {
                                  setQuery(p.name);
                                  onSubmit({ q: p.name });
                                }}
                                className="rounded-[14px]"
                              >
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1 truncate">{p.name}</span>
                                {p.type ? (
                                  <span className="text-xs text-muted-foreground">
                                    {p.type === "hotel"
                                      ? "Отель"
                                      : p.type === "restaurant"
                                        ? "Еда"
                                        : p.type === "attraction"
                                          ? "Туры"
                                          : p.type}
                                  </span>
                                ) : null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {!isFetching && places.length === 0 ? (
                            <CommandEmpty>
                              <div className="px-3 py-4 text-sm text-muted-foreground">
                                Ничего не нашли. Попробуйте другой запрос.
                              </div>
                            </CommandEmpty>
                          ) : null}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Попробуйте:</span>
        {POPULAR_DESTINATIONS.slice(0, 3).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setQuery(d);
              onSubmit({ q: d });
            }}
            className="text-foreground/90 hover:text-foreground transition-colors"
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

