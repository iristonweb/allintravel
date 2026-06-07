import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AmbientBackgroundProps = {
  children: ReactNode;
  className?: string;
  showOrbs?: boolean;
  showNoise?: boolean;
};

export default function AmbientBackground({
  children,
  className,
  showOrbs = true,
  showNoise = true,
}: AmbientBackgroundProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("relative min-h-screen overflow-x-hidden", className)}>
      {showOrbs && !reduceMotion && (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div
            className="ait-ambient-orb w-[480px] h-[480px] -top-32 -left-24 opacity-40"
            style={{ background: "rgba(139, 92, 246, 0.35)" }}
          />
          <div
            className="ait-ambient-orb w-[400px] h-[400px] top-1/3 -right-32 opacity-30"
            style={{ background: "rgba(255, 122, 24, 0.25)", animationDelay: "-4s" }}
          />
          <div
            className="ait-ambient-orb w-[320px] h-[320px] bottom-0 left-1/3 opacity-25"
            style={{ background: "rgba(34, 211, 238, 0.2)", animationDelay: "-8s" }}
          />
        </div>
      )}
      {showNoise && (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 -z-10 bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%270.04%27/%3E%3C/svg%3E')]",
            showOrbs ? "opacity-50" : "opacity-20",
          )}
        />
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        {children}
      </motion.div>
    </div>
  );
}
