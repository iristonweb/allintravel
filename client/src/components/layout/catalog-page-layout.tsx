import type { ReactNode } from "react";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitSearchBar from "@/components/ait-ui/AitSearchBar";
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
    <div className={cn("space-y-section", className)}>
      {search ? (
        <AitSurface padding="sm" radius="lg" glow>
          {search}
        </AitSurface>
      ) : null}
      {filters ? (
        <AitSurface padding="md" radius="lg" glow className="space-y-4">
          {filters}
        </AitSurface>
      ) : null}
      {stats ? <div className="flex flex-wrap gap-3">{stats}</div> : null}
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
    <AitSearchBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type="search"
      size="md"
      className="w-full"
    />
  );
}

/** @deprecated use CatalogSearchInput with AitSearchBar */
export function LegacyCatalogSearchInput({
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
