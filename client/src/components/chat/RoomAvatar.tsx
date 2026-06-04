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
  className = "h-11 w-11",
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
        <span
          className={cn(
            "leading-none",
            className.includes("h-12") ? "text-base" : className.includes("h-11") ? "text-sm" : "text-xs",
          )}
        >
          {initial}
        </span>
      </div>
    );
  }

  return <Hash className={cn("shrink-0 text-ait-purple opacity-70", className.includes("h-12") ? "h-6 w-6" : className.includes("h-11") ? "h-5 w-5" : "h-4 w-4")} />;
}
