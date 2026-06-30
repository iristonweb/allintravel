import type { ReactNode } from "react";
import PageHeader from "@/components/page-header";
import type { AppBreadcrumbItem } from "@/components/layout/app-breadcrumbs";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title?: string;
  description?: string;
  rightSlot?: ReactNode;
  backHref?: string;
  breadcrumbs?: AppBreadcrumbItem[];
  stats?: ReactNode;
  titleVariant?: "page" | "immersive";
  className?: string;
  children: ReactNode;
};

export default function PageShell({
  title,
  description,
  rightSlot,
  backHref,
  breadcrumbs,
  stats,
  titleVariant = "page",
  className,
  children,
}: PageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {titleVariant === "page" ? (
        <PageHeader
          title={title ?? ""}
          description={description}
          rightSlot={rightSlot}
          backHref={backHref}
          breadcrumbs={breadcrumbs}
        />
      ) : (
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <PageHeader breadcrumbs={breadcrumbs} title="" />
          )}
          {title ? <h1 className="ait-section-title">{title}</h1> : null}
          {description ? <p className="text-muted-foreground mt-1">{description}</p> : null}
          {rightSlot ? <div className="mt-4 flex justify-end">{rightSlot}</div> : null}
        </div>
      )}
      {stats ? <div>{stats}</div> : null}
      {children}
    </div>
  );
}
