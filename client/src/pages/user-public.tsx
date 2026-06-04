import { Link, useParams } from "wouter";
import AppLayout from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { UserProfile } from "@shared/schema";
import { MessageCircle, UserPlus, MapPin } from "lucide-react";
import FollowButton from "@/components/social/FollowButton";

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
};

export function UserPublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: publicUser, isLoading, error } = useQuery<PublicUserView>({
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

  if (error || !publicUser) {
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

  return (
    <AppLayout contentClassName="py-6 max-w-lg mx-auto">
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-start">
            <Avatar className="h-20 w-20">
              <AvatarImage src={resolveMediaUrl(publicUser.profileImageUrl)} />
              <AvatarFallback>{getUserInitial(publicUser)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{getUserDisplayLabel(publicUser)}</h1>
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
                <UserPlus className="h-4 w-4 mr-1" />
                В друзья
              </Button>
            )}
            <FollowButton userId={publicUser.id} />
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

export default UserPublicProfile;
