import { useState } from "react";
import PassportCard from "@/components/passport/PassportCard";
import PlatformWalletCard from "@/components/wallet/PlatformWalletCard";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import GlassCard from "@/components/brand/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileHubLinks } from "@/lib/profile-hub-links";
import {
  Settings,
  Search,
  Edit,
  AlertCircle,
  LogOut,
  Music,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformWallet } from "@/hooks/usePlatformWallet";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import type { User } from "@shared/schema";
import UserPreviewCell from "@/components/social/UserPreviewCell";
import { apiRequest } from "@/lib/queryClient";
import { unsubscribePush } from "@/lib/push-subscription";

export function Profile() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [nickSearch, setNickSearch] = useState("");
  const { linksWithMap } = useProfileHubLinks();
  const { data: walletProfile } = usePlatformWallet(isAuthenticated);

  const {
    data: friends = [],
    isLoading: friendsLoading,
    isError: friendsError,
    refetch: refetchFriends,
  } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/search/users", { q: nickSearch, exact: "1" }],
    enabled: nickSearch.replace(/^@/, "").length >= 3,
  });

  if (!isAuthenticated || !user) {
    return (
      <AppLayout contentClassName="py-16">
        <p className="text-center text-muted-foreground">{t("profile.signInRequired")}</p>
      </AppLayout>
    );
  }

  const handleNickSearch = () => {
    const term = nickSearch.trim().replace(/^@/, "");
    if (term.length < 3) return;
    navigate(`/u/${term}`);
  };

  const logout = async () => {
    await unsubscribePush().catch(() => undefined);
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };

  return (
    <AppLayout contentClassName="py-6">
      <div className="max-w-4xl mx-auto">
        <PageShell title={t("nav.profile")} description={t("profile.hubHint")}>
          {friendsLoading ? (
            <GlassCard className="mb-6 p-6 space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
            </GlassCard>
          ) : friendsError ? (
            <EmptyState
              icon={AlertCircle}
              title={t("profile.loadError")}
              action={
                <Button variant="outline" onClick={() => refetchFriends()}>
                  {t("common.retry")}
                </Button>
              }
            />
          ) : (
            <>
              <GlassCard className="mb-6 p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={resolveMediaUrl(user.profileImageUrl)} />
                    <AvatarFallback className="text-2xl">{getUserInitial(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold">{getUserDisplayLabel(user)}</h1>
                      {getUserHandle(user) && (
                        <span className="text-muted-foreground">{getUserHandle(user)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/profile/edit">
                          <Edit className="h-4 w-4 mr-1" />
                          {t("profile.edit")}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/profile/settings">
                          <Settings className="h-4 w-4 mr-1" />
                          {t("profile.settings")}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/profile/music">
                          <Music className="h-4 w-4 mr-1" />
                          {t("profile.myMusic")}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/wallet">
                          <Wallet className="h-4 w-4 mr-1" />
                          {t("nav.wallet")}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => void logout()}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        {t("profile.logout")}
                      </Button>
                    </div>
                    <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                      <Link href="/friends" className="hover:text-ait-purple transition-colors">
                        <strong className="text-foreground">
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
                        <UserPreviewCell
                          key={friend.id}
                          user={friend}
                          className="min-w-[100px] shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>

              <PassportCard compact />

              <PlatformWalletCard compact className="mb-6" />

              <GlassCard className="mb-6 p-4">
                <h2 className="text-sm font-medium mb-3">{t("profile.hubSection")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {linksWithMap.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                        <item.icon className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                        {item.href === "/wallet" && walletProfile ? (
                          <Badge className="shrink-0 bg-ait-orange/90 border-0 text-[10px] tabular-nums">
                            {walletProfile.spendBalance > 999
                              ? `${Math.floor(walletProfile.spendBalance / 1000)}k`
                              : walletProfile.spendBalance}
                          </Badge>
                        ) : item.badge ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {item.badge}
                          </Badge>
                        ) : null}
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="mb-6 p-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {t("profile.findByUsername")}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("profile.usernamePlaceholder")}
                    value={nickSearch}
                    onChange={(e) => setNickSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNickSearch()}
                  />
                  <Button type="button" onClick={handleNickSearch}>
                    {t("profile.find")}
                  </Button>
                </div>
                {searchResults.length > 0 && nickSearch.length >= 3 && (
                  <div className="mt-3 space-y-2">
                    {searchResults.map((u) => (
                      <Link
                        key={u.id}
                        href={u.username ? `/u/${u.username}` : `/chat?with=${u.id}&tab=personal`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} />
                          <AvatarFallback>{getUserInitial(u)}</AvatarFallback>
                        </Avatar>
                        <span>{getUserDisplayLabel(u)}</span>
                        {u.username && (
                          <span className="text-muted-foreground text-sm">@{u.username}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </PageShell>
      </div>
    </AppLayout>
  );
}

export default Profile;
