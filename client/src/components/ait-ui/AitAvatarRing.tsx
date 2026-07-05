import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AitAvatarRingProps = {
  src?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "story";
  active?: boolean;
  className?: string;
};

const circleSizeMap = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

const storySizeMap = {
  sm: "w-[40px] h-[56px]",
  md: "w-[44px] h-[62px]",
  lg: "w-[52px] h-[72px]",
  xl: "w-[56px] h-[80px]",
};

export default function AitAvatarRing({
  src,
  fallback,
  size = "md",
  shape = "circle",
  active = true,
  className,
}: AitAvatarRingProps) {
  const isStory = shape === "story";
  const dimensions = isStory ? storySizeMap[size] : circleSizeMap[size];

  return (
    <div
      className={cn(
        "shrink-0",
        isStory ? "p-[3px] rounded-[28px]" : "p-[2px] rounded-full",
        active
          ? "bg-gradient-to-tr from-ait-purple via-ait-violet to-ait-orange ait-glow-pulse shadow-[0_0_16px_rgba(139,92,246,0.45)]"
          : "bg-white/15",
        className,
      )}
    >
      <Avatar
        className={cn(
          dimensions,
          "border-2 border-background",
          isStory ? "rounded-[24px]" : "rounded-full",
        )}
      >
        <AvatarImage src={src ?? undefined} className={isStory ? "object-cover" : undefined} />
        <AvatarFallback className={isStory ? "rounded-[24px] text-xs" : undefined}>
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
