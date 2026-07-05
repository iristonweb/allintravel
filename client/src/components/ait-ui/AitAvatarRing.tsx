import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AitAvatarRingProps = {
  src?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

export default function AitAvatarRing({
  src,
  fallback,
  size = "md",
  active = true,
  className,
}: AitAvatarRingProps) {
  return (
    <div
      className={cn(
        "p-[2px] rounded-full shrink-0",
        active
          ? "bg-gradient-to-tr from-ait-purple via-ait-violet to-ait-orange ait-glow-pulse"
          : "bg-white/15",
        className,
      )}
    >
      <Avatar className={cn(sizeMap[size], "border-2 border-background")}>
        <AvatarImage src={src ?? undefined} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    </div>
  );
}
