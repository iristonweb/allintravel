import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  hover?: boolean;
};

export default function GlassCard({ children, className, strong, hover }: GlassCardProps) {
  const base = strong ? "ait-glass-strong rounded-[24px]" : "ait-glass rounded-[20px]";

  if (hover) {
    return (
      <motion.div
        className={cn(base, className)}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={cn(base, className)}>{children}</div>;
}
