import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarPreviewTrigger } from "@/components/ait/AvatarPreview";
import { resolveAvatarSrc } from "@/lib/resolve-media-url";
import { useTranslation } from "react-i18next";

type PresenceDotProps = {
  isOnline?: boolean;
  className?: string;
};

export function PresenceDot({ isOnline, className }: PresenceDotProps) {
  const { t } = useTranslation();
  if (isOnline === undefined) return null;
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#050816]",
        isOnline ? "bg-green-500" : "bg-slate-500",
        className,
      )}
      aria-label={isOnline ? t("presence.online") : t("presence.offline")}
    />
  );
}

type AvatarWithPresenceProps = {
  src?: string | null;
  fallback: ReactNode;
  isOnline?: boolean;
  className?: string;
  label?: string | null;
  previewable?: boolean;
};

export function AvatarWithPresence({
  src,
  fallback,
  isOnline,
  className = "h-12 w-12",
  label,
  previewable = true,
}: AvatarWithPresenceProps) {
  const resolvedSrc = resolveAvatarSrc(src);

  const body = (
    <div className="relative h-full w-full">
      <Avatar className="h-full w-full">
        <AvatarImage src={resolvedSrc} alt="" />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <PresenceDot isOnline={isOnline} className="h-3 w-3 pointer-events-none" />
    </div>
  );

  if (previewable && resolvedSrc) {
    return (
      <AvatarPreviewTrigger
        src={resolvedSrc}
        label={label}
        className={cn("shrink-0 rounded-full", className)}
      >
        {body}
      </AvatarPreviewTrigger>
    );
  }

  return <div className={cn("relative shrink-0", className)}>{body}</div>;
}
