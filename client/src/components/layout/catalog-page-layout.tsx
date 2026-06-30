import type { ReactNode } from "react";
import SmartSearchField from "@/components/search/SmartSearchField";
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
        <div className="ait-glass-strong rounded-card p-4 md:p-5 border border-white/10 ait-gradient-border space-y-0">
          {filters}
        </div>
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
    <SmartSearchField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type="search"
      size="sm"
      className="w-full"
    />
  );
}
