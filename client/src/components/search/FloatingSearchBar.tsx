import { useMemo, useState, type ComponentType } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, Sparkles, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import DestinationSearch from "@/components/search/DestinationSearch";
import { saveSearchIntent } from "@/lib/searchIntent";

type SearchKind = "all" | "hotel" | "restaurant" | "attraction";

const SEARCH_KINDS: Array<{
  value: SearchKind;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "all", labelKey: "search.floating.all", icon: MapPin },
  { value: "hotel", labelKey: "search.floating.hotels", icon: Building2 },
  { value: "restaurant", labelKey: "search.floating.food", icon: UtensilsCrossed },
  { value: "attraction", labelKey: "search.floating.tours", icon: Sparkles },
];

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
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [kind, setKind] = useState<SearchKind>(defaultKind);
  const [query, setQuery] = useState(defaultQuery);

  const placeholder = useMemo(() => {
    if (kind === "hotel") return t("search.floating.hotelPlaceholder");
    if (kind === "restaurant") return t("search.floating.restaurantPlaceholder");
    if (kind === "attraction") return t("search.floating.attractionPlaceholder");
    return t("search.floating.defaultPlaceholder");
  }, [kind, t]);

  const onNavigate = (href: string) => {
    const withType =
      kind !== "all" && href.startsWith("/places")
        ? `${href}${href.includes("?") ? "&" : "?"}type=${kind}`
        : href;
    saveSearchIntent(withType);
    navigate(withType);
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
            {t(k.labelKey)}
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
          <DestinationSearch
            value={query}
            onChange={setQuery}
            onNavigate={onNavigate}
            placeholder={placeholder}
            placeType={kind}
            inputClassName="h-12 border-0 bg-transparent text-base focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
