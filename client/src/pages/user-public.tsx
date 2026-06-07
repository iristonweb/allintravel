import { Link, useParams } from "wouter";
import AppLayout from "@/components/app-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import CreatorAvatar from "@/components/ait/CreatorAvatar";
import UserTipButton from "@/components/ait/UserTipButton";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { UserProfile } from "@shared/schema";
import { MessageCircle, UserPlus, MapPin, Compass, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FollowButton from "@/components/social/FollowButton";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";
import EmptyState from "@/components/empty-state";

type PublicUserView = {
  id: string;
  username: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isOnline?: boolean;
  lastSeenAt?: string;
  isFriend?: boolean;
  creatorBadge?: boolean;
  creatorRank?: { title: string };
};

export function UserPublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: me } = useAuth();

  const {
    data: publicUser,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PublicUserView>({
    queryKey: [`/api/users/by-username/${username}`],
    enabled: username.length >= 3,
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: [`/api/profile/${publicUser?.id}`],
    enabled: !!publicUser?.id,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/friends/request/${publicUser!.id}`),
    onSuccess: () => {
      toast({ title: "Запрос отправлен" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/sent"] });
    },
    onError: () => toast({ title: "Не удалось отправить запрос", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <AppLayout contentClassName="py-6 max-w-lg mx-auto">
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout contentClassName="py-16 max-w-lg mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="Не удалось загрузить профиль"
          description={error instanceof Error ? error.message : undefined}
          action={
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Повторить
              </Button>
              <Button asChild variant="ghost">
                <Link href="/profile">В мой профиль</Link>
              </Button>
            </div>
          }
        />
      </AppLayout>
    );
  }

  if (!publicUser) {
    return (
      <AppLayout contentClassName="py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Профиль недоступен</h1>
        <p className="text-muted-foreground mb-4">Пользователь не найден или аккаунт закрыт</p>
        <Button asChild variant="outline">
          <Link href="/profile">В мой профиль</Link>
        </Button>
      </AppLayout>
    );
  }

  const displayLabel = getUserDisplayLabel(publicUser);

  return (
    <AppLayout contentClassName="py-6 max-w-lg mx-auto">
      <AppBreadcrumbs items={[{ label: "Профиль", href: "/profile" }, { label: displayLabel }]} />
      <GlassCard className="p-6">
        <div className="flex gap-4 items-start">
          <CreatorAvatar
            className="h-20 w-20"
            src={publicUser.profileImageUrl}
            fallback={getUserInitial(publicUser)}
            creatorBadge={publicUser.creatorBadge}
          />
          <div>
            <h1 className="text-xl font-bold">{getUserDisplayLabel(publicUser)}</h1>
            {publicUser.creatorRank && (
              <Badge variant="secondary" className="mt-1 text-ait-purple">
                {publicUser.creatorRank.title}
              </Badge>
            )}
            {getUserHandle(publicUser) && (
              <p className="text-muted-foreground">{getUserHandle(publicUser)}</p>
            )}
            {publicUser.isOnline !== undefined && (
              <p className="text-sm mt-1">
                {publicUser.isOnline ? (
                  <span className="text-green-600">В сети</span>
                ) : publicUser.lastSeenAt ? (
                  <span className="text-muted-foreground">Был(а) недавно</span>
                ) : null}
              </p>
            )}
          </div>
        </div>
        {profile?.bio && <p className="mt-4 text-muted-foreground">{profile.bio}</p>}
        {profile?.location && (
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {profile.location}
          </p>
        )}
        {profile?.travelStyle && (
          <p className="mt-2 flex items-center gap-1 text-sm">
            <Compass className="h-4 w-4 text-ait-purple" />
            <span className="text-muted-foreground">Стиль:</span> {profile.travelStyle}
          </p>
        )}
        {profile?.website && (
          <p className="mt-2 text-sm">
            <a
              href={
                profile.website.startsWith("http") ? profile.website : `https://${profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-ait-purple hover:underline"
            >
              {profile.website}
            </a>
          </p>
        )}
        {(profile?.interests?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Интересы</p>
            <div className="flex flex-wrap gap-1">
              {profile!.interests!.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {(profile?.languages?.length ?? 0) > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Языки</p>
            <div className="flex flex-wrap gap-1">
              {profile!.languages!.map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {(profile?.favoriteDestinations?.length ?? 0) > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Любимые направления</p>
            <div className="flex flex-wrap gap-1">
              {profile!.favoriteDestinations!.map((dest) => (
                <Badge key={dest} variant="outline" className="text-xs">
                  {dest}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-6">
          <Button asChild size="sm">
            <Link href={`/messages?with=${publicUser.id}`}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Написать
            </Link>
          </Button>
          {!publicUser.isFriend && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendRequestMutation.mutate()}
              disabled={sendRequestMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-1" />В друзья
            </Button>
          )}
          <FollowButton userId={publicUser.id} />
          <UserTipButton userId={publicUser.id} currentUserId={me?.id} />
        </div>
      </GlassCard>
    </AppLayout>
  );
}

export default UserPublicProfile;
