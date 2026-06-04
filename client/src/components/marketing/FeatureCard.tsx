import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[var(--ait-radius-card)]",
        "ait-surface text-card-foreground",
        "transition-transform duration-200 ease-out hover:-translate-y-[5px]",
        "hover:border-border/80",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(600px_260px_at_50%_-10%,rgba(15,208,193,0.14),transparent_55%)]" />
      </div>

      <div className="relative p-6">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-card/40 text-[var(--ait-primary)]">
          {icon}
        </div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </Card>
  );
}

export default FeatureCard;
