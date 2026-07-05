import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef, type ComponentProps } from "react";

const AitInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        "ait-input-glass h-11 rounded-button border-white/10 bg-white/[0.04] transition-all duration-300",
        "focus-visible:ring-ait-purple/40 focus-visible:border-ait-purple/50",
        className,
      )}
      {...props}
    />
  ),
);
AitInput.displayName = "AitInput";

export default AitInput;
