import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type AitTabItem<T extends string = string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

type AitTabsProps<T extends string = string> = {
  tabs: AitTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  layoutId?: string;
  className?: string;
};

export default function AitTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  layoutId = "ait-tabs-glider",
  className,
}: AitTabsProps<T>) {
  return (
    <ChatFilterTabs
      className={cn("ait-filter-tabs", className)}
      tabs={tabs.map(({ id, label, icon: Icon }) => ({
        id,
        label: (
          <span className="inline-flex items-center gap-1.5">
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
            {label}
          </span>
        ),
      }))}
      value={value}
      onChange={onChange as (id: string) => void}
      layoutId={layoutId}
    />
  );
}
