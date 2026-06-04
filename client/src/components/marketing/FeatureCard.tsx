import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      className={cn(
        "group relative overflow-hidden rounded-[28px] ait-glass-strong ait-gradient-border p-6",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(400px_200px_at_50%_0%,rgba(139,92,246,0.15),transparent)]" />
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ait-nav-active text-ait-purple">
          {icon}
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export default FeatureCard;
