import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

type CreatorAvatarProps = {
  src?: string | null;
  fallback: string;
  creatorBadge?: boolean;
  className?: string;
};

export default function CreatorAvatar({
  src,
  fallback,
  creatorBadge,
  className,
}: CreatorAvatarProps) {
  return (
    <div className={cn("relative shrink-0 h-10 w-10", className)}>
      <Avatar
        className={cn(
          "h-full w-full",
          creatorBadge &&
            "ring-2 ring-ait-orange/90 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        )}
      >
        <AvatarImage src={resolveMediaUrl(src)} alt="" />
        <AvatarFallback className="bg-gradient-to-br from-ait-purple/80 to-ait-orange/70 text-white">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {creatorBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-ait-orange to-ait-gold border-2 border-background shadow-sm"
          title="Storyteller"
        />
      )}
    </div>
  );
}
