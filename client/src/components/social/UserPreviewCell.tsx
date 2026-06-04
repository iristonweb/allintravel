import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { User } from "@shared/schema";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

type UserPreviewCellProps = {
  user: User;
  className?: string;
  subtitle?: string;
  onNavigate?: () => void;
};

export function friendProfileHref(user: User): string | null {
  if (user.username && user.username.length >= 3) {
    return `/u/${user.username}`;
  }
  return null;
}

export default function UserPreviewCell({
  user,
  className,
  subtitle,
  onNavigate,
}: UserPreviewCellProps) {
  const href = friendProfileHref(user);
  const inner = (
    <>
      <Avatar className="h-14 w-14 mx-auto ring-2 ring-ait-purple/30">
        <AvatarImage src={resolveMediaUrl(user.profileImageUrl)} />
        <AvatarFallback>{getUserInitial(user)}</AvatarFallback>
      </Avatar>
      <p className="mt-2 text-sm font-medium truncate w-full text-center">
        {getUserDisplayLabel(user)}
      </p>
      {(subtitle || getUserHandle(user)) && (
        <p className="text-xs text-muted-foreground truncate w-full text-center">
          {subtitle ?? getUserHandle(user)}
        </p>
      )}
    </>
  );

  if (!href) {
    return (
      <div
        className={cn(
          "ait-glass rounded-2xl p-3 flex flex-col items-center text-center opacity-90",
          className,
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "ait-glass rounded-2xl p-3 flex flex-col items-center text-center transition-colors hover:bg-white/10 block",
        className,
      )}
    >
      {inner}
    </Link>
  );
}
