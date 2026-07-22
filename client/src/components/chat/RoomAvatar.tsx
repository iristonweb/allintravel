import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/resolve-media-url";
import { AvatarPreviewTrigger } from "@/components/ait/AvatarPreview";
import { Hash } from "lucide-react";

type RoomAvatarProps = {
  title: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
  previewable?: boolean;
};

export default function RoomAvatar({
  title,
  avatarUrl,
  className = "h-11 w-11",
  fallbackClassName,
  previewable = true,
}: RoomAvatarProps) {
  const resolved = resolveAvatarSrc(avatarUrl);
  const initial = (title.trim().slice(0, 1) || "?").toUpperCase();

  if (resolved) {
    const img = (
      <img
        src={resolved}
        alt=""
        className={cn("aspect-square rounded-full object-cover object-center shrink-0", className)}
      />
    );
    if (!previewable) return img;
    return (
      <AvatarPreviewTrigger src={resolved} label={title} className={cn("rounded-full", className)}>
        <img
          src={resolved}
          alt=""
          className="h-full w-full rounded-full object-cover object-center"
        />
      </AvatarPreviewTrigger>
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
            className.includes("h-16")
              ? "text-lg"
              : className.includes("h-14")
                ? "text-base"
                : className.includes("h-12")
                  ? "text-base"
                  : className.includes("h-11")
                    ? "text-sm"
                    : "text-xs",
          )}
        >
          {initial}
        </span>
      </div>
    );
  }

  return (
    <Hash
      className={cn(
        "shrink-0 text-ait-purple opacity-70",
        className.includes("h-16")
          ? "h-7 w-7"
          : className.includes("h-14")
            ? "h-6 w-6"
            : className.includes("h-12")
              ? "h-6 w-6"
              : className.includes("h-11")
                ? "h-5 w-5"
                : "h-4 w-4",
      )}
    />
  );
}
