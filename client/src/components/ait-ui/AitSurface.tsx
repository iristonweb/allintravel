import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type AitSurfaceProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  glow?: boolean;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "card" | "lg" | "xl" | "panel";
} & Omit<HTMLMotionProps<"div">, "children">;

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-card",
  lg: "p-8",
};

const radiusMap = {
  card: "rounded-card",
  lg: "rounded-card-lg",
  xl: "rounded-card-xl",
  panel: "rounded-panel",
};

export default function AitSurface({
  children,
  className,
  strong,
  glow,
  hover,
  padding = "md",
  radius = "card",
  ...motionProps
}: AitSurfaceProps) {
  const base = cn(
    strong ? "ait-glass-strong" : "ait-glass",
    radiusMap[radius],
    paddingMap[padding],
    glow && "ait-surface-glow",
    !glow && "shadow-ait-elevation-1",
    className,
  );

  if (hover) {
    return (
      <motion.div
        className={cn(base, "ait-hover-lift")}
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={base} {...motionProps}>
      {children}
    </motion.div>
  );
}
