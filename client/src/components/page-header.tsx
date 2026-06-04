import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppBreadcrumbs, { type AppBreadcrumbItem } from "@/components/layout/app-breadcrumbs";

type PageHeaderProps = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
  className?: string;
  backHref?: string;
  breadcrumbs?: AppBreadcrumbItem[];
};

export default function PageHeader({
  title,
  description,
  rightSlot,
  className,
  backHref,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3", className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <AppBreadcrumbs items={breadcrumbs} className="mb-2" />
        ) : backHref ? (
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href={backHref}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Link>
          </Button>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {rightSlot ? <div className="flex-shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

