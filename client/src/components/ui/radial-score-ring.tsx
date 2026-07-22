import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RadialScoreRingProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  className?: string;
  /** Accessible description, e.g. "Travel score 72 out of 100" */
  ariaLabel?: string;
};

export default function RadialScoreRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  subLabel,
  className,
  ariaLabel,
}: RadialScoreRingProps) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const targetOffset = circumference - (pct / 100) * circumference;
  const [offset, setOffset] = useState(reduceMotion ? targetOffset : circumference);

  useEffect(() => {
    if (reduceMotion) {
      setOffset(targetOffset);
      return;
    }
    const frame = requestAnimationFrame(() => setOffset(targetOffset));
    return () => cancelAnimationFrame(frame);
  }, [targetOffset, reduceMotion]);

  const displayValue = Math.round(value);
  const accessibleLabel =
    ariaLabel ?? `${label ?? "Score"} ${displayValue}${max !== 100 ? ` out of ${max}` : ""}`;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      role="img"
      aria-label={accessibleLabel}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ait-purple, #8b5cf6)" />
            <stop offset="100%" stopColor="var(--ait-orange, #ff7a18)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/40"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span
          className={cn(
            "font-bold text-foreground leading-none",
            size >= 100 ? "text-2xl" : size >= 80 ? "text-xl" : "text-lg",
          )}
        >
          {displayValue}
        </span>
        {label && (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">
            {label}
          </span>
        )}
        {subLabel && (
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight px-0.5">
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
