import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  hover?: boolean;
};

/** @deprecated Prefer AitSurface from @/components/ait-ui */
export default function GlassCard({ children, className, strong, hover }: GlassCardProps) {
  return (
    <AitSurface
      strong={strong}
      hover={hover}
      padding="none"
      className={cn("overflow-hidden", className)}
    >
      {children}
    </AitSurface>
  );
}
