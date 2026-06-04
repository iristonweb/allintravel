import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

type PresenceDotProps = {
  isOnline?: boolean;
  className?: string;
};

export function PresenceDot({ isOnline, className }: PresenceDotProps) {
  if (isOnline === undefined) return null;
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#050816]",
        isOnline ? "bg-green-500" : "bg-slate-500",
        className,
      )}
      aria-label={isOnline ? "В сети" : "Не в сети"}
    />
  );
}

type AvatarWithPresenceProps = {
  src?: string | null;
  fallback: ReactNode;
  isOnline?: boolean;
  className?: string;
};

export function AvatarWithPresence({
  src,
  fallback,
  isOnline,
  className = "h-12 w-12",
}: AvatarWithPresenceProps) {
  const resolvedSrc = resolveMediaUrl(src);
  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn("h-full w-full", className)}>
        <AvatarImage src={resolvedSrc} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <PresenceDot isOnline={isOnline} className="h-3 w-3" />
    </div>
  );
}
