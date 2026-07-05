import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type AitButtonVariant = "primary" | "secondary" | "ghost" | "glass" | "filter";

const variantMap: Record<AitButtonVariant, ButtonProps["variant"]> = {
  primary: "premium",
  secondary: "secondary",
  ghost: "ghost",
  glass: "glass",
  filter: "filter",
};

type AitButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: AitButtonVariant;
};

const AitButton = forwardRef<HTMLButtonElement, AitButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variantMap[variant]}
      className={cn(
        "transition-all duration-300 rounded-button",
        variant === "primary" && "shadow-ait-glow-purple/30",
        className,
      )}
      {...props}
    />
  ),
);
AitButton.displayName = "AitButton";

export default AitButton;
