import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserInitial } from "@shared/user-display";
import { LogOut, Settings, User, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AvatarHubMenuProps = {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
  } | null;
  hasUnreadBadge?: boolean;
};

export default function AvatarHubMenu({ user, hasUnreadBadge }: AvatarHubMenuProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const label = user ? getUserInitial(user) : "U";

  const handleLogout = async () => {
    await apiRequest("POST", "/api/logout");
    queryClient.clear();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.profile", { defaultValue: "Profile" })}
          className={cn(
            "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1",
            "transition-all duration-300 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/60",
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-white/20 shadow-ait-glow-purple/30">
            <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
            <AvatarFallback className="bg-gradient-to-br from-ait-purple to-ait-orange text-xs text-white">
              {label}
            </AvatarFallback>
          </Avatar>
          {hasUnreadBadge && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-ait-orange ring-2 ring-ait-void" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="ait-glass-strong border-white/10 w-52">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer gap-2">
            <User className="h-4 w-4" />
            {t("nav.profile", { defaultValue: "Profile" })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/settings" className="cursor-pointer gap-2">
            <Settings className="h-4 w-4" />
            {t("nav.settings", { defaultValue: "Settings" })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wallet" className="cursor-pointer gap-2">
            <Wallet className="h-4 w-4" />
            {t("nav.wallet", { defaultValue: "Wallet" })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-red-400 focus:text-red-300"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout", { defaultValue: "Log out" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
