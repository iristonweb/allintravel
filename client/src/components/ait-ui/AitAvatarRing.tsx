import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarPreviewTrigger } from "@/components/ait/AvatarPreview";
import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/resolve-media-url";

type AitAvatarRingProps = {
  src?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "story";
  active?: boolean;
  className?: string;
  label?: string | null;
  /** Full-size preview on click. Default true for circle; false for story chips. */
  previewable?: boolean;
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
  label,
  previewable,
}: AitAvatarRingProps) {
  const isStory = shape === "story";
  const dimensions = isStory ? storySizeMap[size] : circleSizeMap[size];
  const imageSrc = resolveAvatarSrc(src);
  const canPreview = (previewable ?? !isStory) && Boolean(imageSrc);

  const ring = (
    <div
      className={cn(
        "shrink-0",
        isStory ? "p-[3px] rounded-[28px]" : "p-[2.5px] rounded-full",
        active
          ? "bg-gradient-to-tr from-ait-purple via-ait-violet to-ait-orange ait-glow-pulse shadow-[0_0_16px_rgba(139,92,246,0.45)]"
          : "bg-white/15",
        className,
      )}
    >
      <Avatar
        className={cn(
          dimensions,
          "border-2 border-background bg-ait-deep",
          isStory ? "rounded-[24px]" : "rounded-full",
        )}
      >
        <AvatarImage
          src={imageSrc}
          alt=""
          className={isStory ? "rounded-[22px] object-[center_20%]" : undefined}
        />
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br from-ait-purple/70 to-ait-navy text-white",
            isStory ? "rounded-[22px] text-xs" : undefined,
          )}
        >
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  if (!canPreview || !imageSrc) {
    return ring;
  }

  return (
    <AvatarPreviewTrigger src={imageSrc} label={label} className="rounded-full">
      {ring}
    </AvatarPreviewTrigger>
  );
}
