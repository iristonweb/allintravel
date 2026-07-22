import { Link } from "wouter";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserPreviewCell from "@/components/social/UserPreviewCell";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { User } from "@shared/schema";
import { Edit, LogOut, Music, Settings, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

type ProfileHeroCardProps = {
  user: User;
  friends: User[];
  onLogout: () => void;
};

export default function ProfileHeroCard({ user, friends, onLogout }: ProfileHeroCardProps) {
  const { t } = useTranslation();

  return (
    <AitSurface className="mb-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="relative shrink-0 rounded-full p-[3px] bg-gradient-to-tr from-ait-purple via-ait-violet to-ait-orange shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          <Avatar className="h-24 w-24 border-[3px] border-background">
            <AvatarImage src={resolveMediaUrl(user.profileImageUrl)} alt="" />
            <AvatarFallback className="bg-gradient-to-br from-ait-purple to-ait-orange text-2xl text-white">
              {getUserInitial(user)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold tracking-tight">{getUserDisplayLabel(user)}</h2>
            {getUserHandle(user) && (
              <span className="text-muted-foreground">{getUserHandle(user)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <AitButton variant="glass" size="sm" className="gap-1.5" asChild>
              <Link href="/profile/edit">
                <Edit className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t("profile.edit")}
              </Link>
            </AitButton>
            <AitButton variant="glass" size="sm" className="gap-1.5" asChild>
              <Link href="/profile/settings">
                <Settings className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t("profile.settings")}
              </Link>
            </AitButton>
            <AitButton variant="glass" size="sm" className="gap-1.5" asChild>
              <Link href="/profile/music">
                <Music className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t("profile.myMusic")}
              </Link>
            </AitButton>
            <AitButton variant="glass" size="sm" className="gap-1.5" asChild>
              <Link href="/wallet">
                <Wallet className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t("nav.wallet")}
              </Link>
            </AitButton>
            <AitButton
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {t("profile.logout")}
            </AitButton>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <Link href="/friends" className="hover:text-ait-purple transition-colors">
              <strong className="text-foreground font-medium">
                {t("profile.friendsCount", { count: friends.length })}
              </strong>
            </Link>
          </div>
        </div>
      </div>
      {friends.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">{t("profile.friendsSection")}</p>
            <Link href="/friends" className="text-xs text-ait-purple hover:underline">
              {t("profile.friendsAll", { count: friends.length })}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {friends.slice(0, 8).map((friend) => (
              <UserPreviewCell key={friend.id} user={friend} className="min-w-[100px] shrink-0" />
            ))}
          </div>
        </div>
      )}
    </AitSurface>
  );
}
