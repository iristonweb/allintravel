import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GradientButtonProps = {
  outline?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function GradientButton({
  className,
  outline,
  children,
  onClick,
  disabled,
  type = "button",
}: GradientButtonProps) {
  if (outline) {
    return (
      <motion.button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "rounded-2xl px-8 py-4 text-base font-semibold text-white ait-glass border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50",
          className,
        )}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "ait-btn-glow rounded-2xl px-8 py-4 text-base font-semibold text-white disabled:opacity-50",
        className,
      )}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
