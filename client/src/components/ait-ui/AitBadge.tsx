import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AitBadgeTone = "default" | "pro" | "creator" | "accent";

type AitBadgeProps = Omit<BadgeProps, "variant"> & {
  tone?: AitBadgeTone;
};

export default function AitBadge({ tone = "default", className, ...props }: AitBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full text-[10px] font-bold uppercase tracking-wide px-2 py-0.5",
        tone === "pro" && "bg-ait-orange/20 text-ait-orange border-ait-orange/30",
        tone === "creator" && "bg-ait-purple/20 text-ait-purple border-ait-purple/30",
        tone === "accent" &&
          "bg-gradient-to-r from-ait-purple/30 to-ait-orange/30 text-white border-white/10",
        className,
      )}
      {...props}
    />
  );
}
