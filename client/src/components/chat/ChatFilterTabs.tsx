import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TabItem<T extends string> = { id: T; label: string };

type ChatFilterTabsProps<T extends string> = {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  layoutId?: string;
};

export default function ChatFilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  layoutId = "chat-filter-glider",
}: ChatFilterTabsProps<T>) {
  return (
    <div className={cn("ait-filter-tabs", className)} role="tablist">
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn("ait-filter-tab", active && "ait-filter-tab--active")}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="ait-filter-tab-glider"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
