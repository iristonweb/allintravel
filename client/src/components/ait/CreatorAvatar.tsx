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
    <div className={cn("relative shrink-0", className)}>
      <Avatar
        className={cn(
          creatorBadge && "ring-2 ring-ait-orange ring-offset-2 ring-offset-background",
        )}
      >
        <AvatarImage src={resolveMediaUrl(src)} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {creatorBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-ait-orange to-ait-gold border border-background"
          title="Storyteller"
        />
      )}
    </div>
  );
}
