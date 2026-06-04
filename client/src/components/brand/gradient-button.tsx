import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  outline?: boolean;
};

export default function GradientButton({ className, outline, children, ...props }: GradientButtonProps) {
  if (outline) {
    return (
      <Button
        variant="outline"
        className={cn(
          "rounded-[var(--ait-radius-button)] border-white/20 bg-transparent text-foreground hover:bg-white/5",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button variant="premium" size="cta" className={className} {...props}>
      {children}
    </Button>
  );
}
