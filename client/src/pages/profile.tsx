import { useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Search, Edit, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import UserPreviewCell from "@/components/social/UserPreviewCell";

export function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [nickSearch, setNickSearch] = useState("");

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
        <p className="text-center text-muted-foreground">Войдите в систему</p>
      </AppLayout>
    );
  }

  const handleNickSearch = () => {
    const term = nickSearch.trim().replace(/^@/, "");
    if (term.length < 3) return;
    navigate(`/u/${term}`);
  };

  return (
    <AppLayout contentClassName="py-6">
      <div className="max-w-4xl mx-auto">
        {friendsLoading ? (
          <GlassCard className="mb-6 p-6 space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </GlassCard>
        ) : friendsError ? (
          <EmptyState
            icon={AlertCircle}
            title="Не удалось загрузить профиль"
            action={
              <Button variant="outline" onClick={() => refetchFriends()}>
                Повторить
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
                  <p className="text-sm text-muted-foreground mb-4">
                    Лента, друзья, чаты и настройки — в меню слева. Здесь только ваш профиль и поиск
                    людей.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/profile/edit">
                        <Edit className="h-4 w-4 mr-1" />
                        Редактировать
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/profile/settings">
                        <Settings className="h-4 w-4 mr-1" />
                        Настройки
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                    <Link href="/friends" className="hover:text-ait-purple transition-colors">
                      <strong className="text-foreground">{friends.length}</strong> друзей
                    </Link>
                  </div>
                </div>
              </div>
              {friends.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Друзья</p>
                    <Link href="/friends" className="text-xs text-ait-purple hover:underline">
                      Все ({friends.length})
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

            <GlassCard className="mb-6 p-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Найти человека по @нику
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="@username"
                  value={nickSearch}
                  onChange={(e) => setNickSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNickSearch()}
                />
                <Button type="button" onClick={handleNickSearch}>
                  Найти
                </Button>
              </div>
              {searchResults.length > 0 && nickSearch.length >= 3 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map((u) => (
                    <Link
                      key={u.id}
                      href={u.username ? `/u/${u.username}` : `/messages?with=${u.id}`}
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
      </div>
    </AppLayout>
  );
}

export default Profile;
