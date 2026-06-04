import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
  className?: string;
  backHref?: string;
};

export default function PageHeader({ title, description, rightSlot, className, backHref }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3", className)}>
      <div>
        {backHref && (
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href={backHref}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Link>
          </Button>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {rightSlot ? <div className="flex-shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

