import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
};

export default function GlassCard({ children, className, strong }: GlassCardProps) {
  return (
    <div className={cn(strong ? "ait-glass-strong rounded-2xl" : "ait-glass rounded-2xl", className)}>
      {children}
    </div>
  );
}
