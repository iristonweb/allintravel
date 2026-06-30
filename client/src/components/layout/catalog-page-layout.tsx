import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogPageLayoutProps = {
  search?: ReactNode;
  filters?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function CatalogPageLayout({
  search,
  filters,
  stats,
  children,
  className,
}: CatalogPageLayoutProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {search ? (
        <div className="ait-glass-strong rounded-card p-3 border border-white/10">{search}</div>
      ) : null}
      {filters ? (
        <div className="ait-glass-strong rounded-card p-3 border border-white/10">{filters}</div>
      ) : null}
      {stats ? <div className="flex flex-wrap gap-2">{stats}</div> : null}
      {children}
    </div>
  );
}

export function CatalogSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent pl-10 pr-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
