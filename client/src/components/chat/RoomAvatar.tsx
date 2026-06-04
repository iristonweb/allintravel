import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { Hash } from "lucide-react";

type RoomAvatarProps = {
  title: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export default function RoomAvatar({
  title,
  avatarUrl,
  className = "h-8 w-8",
  fallbackClassName,
}: RoomAvatarProps) {
  const resolved = avatarUrl ? resolveMediaUrl(avatarUrl) : undefined;
  const initial = (title.trim().slice(0, 1) || "?").toUpperCase();

  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        className={cn("rounded-full object-cover shrink-0", className)}
      />
    );
  }

  if (title.trim()) {
    return (
      <div
        className={cn(
          "rounded-full shrink-0 flex items-center justify-center font-bold bg-gradient-to-br from-ait-purple to-ait-orange text-white",
          className,
          fallbackClassName,
        )}
      >
        <span className={cn(className.includes("h-10") ? "text-sm" : "text-xs")}>{initial}</span>
      </div>
    );
  }

  return <Hash className={cn("shrink-0 text-ait-purple opacity-70", className.includes("h-10") ? "h-5 w-5" : "h-4 w-4")} />;
}
