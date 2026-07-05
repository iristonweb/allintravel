import { cn } from "@/lib/utils";

export type AitFilterPillItem<T extends string = string> = {
  id: T;
  label: string;
};

type AitFilterPillsProps<T extends string = string> = {
  items: AitFilterPillItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
};

export default function AitFilterPills<T extends string = string>({
  items,
  value,
  onChange,
  className,
}: AitFilterPillsProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "h-9 shrink-0 px-4 rounded-full text-sm font-medium transition-all duration-300",
              active
                ? "ait-btn-glow text-white border-0 shadow-ait-glow-purple/40"
                : "ait-glass text-slate-300 hover:text-white hover:bg-white/10 border border-white/10",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
