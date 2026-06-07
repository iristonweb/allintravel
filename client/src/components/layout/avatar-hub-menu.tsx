import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserInitial } from "@shared/user-display";

type AvatarHubMenuProps = {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
  } | null;
  hasUnreadBadge?: boolean;
};

/** Аватар в шапке — клик ведёт в профиль (настройки и выход — на странице профиля). */
export default function AvatarHubMenu({ user, hasUnreadBadge }: AvatarHubMenuProps) {
  const label = user ? getUserInitial(user) : "U";

  return (
    <Link
      href="/profile"
      aria-label="Мой профиль"
      className={cn(
        "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1",
        "transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/60",
      )}
    >
      <Avatar className="h-9 w-9 border-2 border-white/20 ait-neon-purple">
        <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
        <AvatarFallback className="bg-gradient-to-br from-[#8b5cf6] to-[#ff7a18] text-xs text-white">
          {label}
        </AvatarFallback>
      </Avatar>
      {hasUnreadBadge && (
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
      )}
    </Link>
  );
}
