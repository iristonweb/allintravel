import { cn } from "@/lib/utils";

export type FeedSort = "popular" | "new" | "discussed";

export type FeedSortTabItem = {
  id: FeedSort;
  label: string;
};

type FeedSortTabsProps = {
  items: FeedSortTabItem[];
  value: FeedSort;
  onChange: (id: FeedSort) => void;
  className?: string;
};

/** Underline tabs for the main feed (matches community hub mockup). */
export default function FeedSortTabs({ items, value, onChange, className }: FeedSortTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-6 border-b border-white/10 overflow-x-auto scrollbar-hide",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative shrink-0 pb-3 text-sm font-medium transition-colors duration-200",
              active ? "text-white" : "text-muted-foreground hover:text-slate-200",
            )}
          >
            {item.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-ait-purple to-ait-orange shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
