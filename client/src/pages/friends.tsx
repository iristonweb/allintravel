import { useState } from "react";
import { Link, useSearch } from "wouter";
import { TRAVEL_DIRECTIONS } from "@shared/travel-directions";
import type { TravelDirectionId } from "@shared/travel-directions";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import EmptyState from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  UserPlus,
  MessageCircle,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { User, FriendshipWithUser, Trip } from "@shared/schema";
import FollowButton from "@/components/social/FollowButton";
import UserPreviewCell, { friendProfileHref } from "@/components/social/UserPreviewCell";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import TripRouteMatches from "@/components/planner/trip-route-matches";
import { cn } from "@/lib/utils";

export function Friends() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchString = useSearch();
  const urlDirection = new URLSearchParams(searchString).get(
    "direction",
  ) as TravelDirectionId | null;
  const [friendDirection, setFriendDirection] = useState<TravelDirectionId | "">(
    urlDirection ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [discoverDirection, setDiscoverDirection] = useState<TravelDirectionId | "">(
    urlDirection ?? "",
  );

  const {
    data: friends = [],
    isLoading: friendsLoading,
    isError: friendsError,
    refetch: refetchFriends,
  } = useQuery<User[]>({
    queryKey: ["/api/friends", friendDirection ? { direction: friendDirection } : {}],
    enabled: isAuthenticated,
  });

  const {
    data: sentRequests = [],
    isLoading: sentLoading,
    isError: sentError,
    refetch: refetchSent,
  } = useQuery<FriendshipWithUser[]>({
    queryKey: ["/api/friends/requests/sent"],
    enabled: isAuthenticated,
  });

  const {
    data: receivedRequests = [],
    isLoading: receivedLoading,
    isError: receivedError,
    refetch: refetchReceived,
  } = useQuery<FriendshipWithUser[]>({
    queryKey: ["/api/friends/requests/received"],
    enabled: isAuthenticated,
  });

  const { data: myTrips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { userId: user?.id, limit: 1 }],
    enabled: !!user?.id,
  });

  const primaryTripId = myTrips[0]?.id;

  const { data: searchResults = [], isLoading: isSearching } = useQuery<User[]>({
    queryKey: [
      "/api/search/users",
      {
        q: activeSearch,
        ...(discoverDirection ? { direction: discoverDirection } : {}),
      },
    ],
    enabled: !!activeSearch && activeSearch.length > 1,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/friends/request/${userId}`),
    onSuccess: () => {
      toast({ title: t("friends.requestSent") });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/sent"] });
    },
    onError: () => {
      toast({ title: t("friends.requestFailed"), variant: "destructive" });
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: ({ friendshipId, status }: { friendshipId: string; status: string }) =>
      apiRequestJson("PUT", `/api/friends/respond/${friendshipId}`, { status }),
    onSuccess: (_, { status }) => {
      toast({ title: status === "accepted" ? t("friends.requestAccepted") : t("friends.requestDeclined") });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/received"] });
    },
    onError: () => {
      toast({ title: t("friends.requestProcessFailed"), variant: "destructive" });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => apiRequest("DELETE", `/api/friends/${friendId}`),
    onSuccess: () => {
      toast({ title: t("friends.friendRemoved") });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: () => {
      toast({ title: t("friends.removeFailed"), variant: "destructive" });
    },
  });

  const handleSearch = () => {
    setActiveSearch(searchQuery.trim());
  };

  const isSentRequest = (userId: string) => sentRequests.some((r) => r.user?.id === userId);

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы управлять друзьями, необходимо войти</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <PageShell
          title={t("friends.title")}
          description={t("friends.description")}
          breadcrumbs={[{ label: t("friends.breadcrumbProfile"), href: "/profile" }, { label: t("friends.title") }]}
        >
        {primaryTripId && <TripRouteMatches tripId={primaryTripId} className="mt-6" />}

        <Tabs defaultValue="friends" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">
              <Users className="mr-2 h-4 w-4" />
              Друзья ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Поиск
            </TabsTrigger>
            <TabsTrigger value="received">
              <UserPlus className="mr-2 h-4 w-4" />
              Входящие ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">Отправленные ({sentRequests.length})</TabsTrigger>
          </TabsList>

          {/* Friends tab */}
          <TabsContent value="friends" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-1.5 ait-glass rounded-full p-1 w-fit">
              <Button
                size="sm"
                variant={friendDirection === "" ? "premium" : "filter"}
                onClick={() => setFriendDirection("")}
              >
                {t("friends.allDirections")}
              </Button>
              {TRAVEL_DIRECTIONS.map((d) => (
                <Button
                  key={d.id}
                  size="sm"
                  variant={friendDirection === d.id ? "premium" : "filter"}
                  onClick={() => setFriendDirection(d.id)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
            {friendsError ? (
              <EmptyState
                icon={AlertCircle}
                title={t("friends.loadError")}
                description={t("friends.connectionError")}
                action={
                  <Button variant="outline" onClick={() => refetchFriends()}>
                    {t("common.retry")}
                  </Button>
                }
              />
            ) : friendsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="h-32 animate-pulse bg-muted" />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">У вас пока нет друзей</h3>
                  <p className="text-muted-foreground">Найдите новых друзей через поиск</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex flex-col gap-2">
                    <UserPreviewCell user={friend} />
                    <div className="flex gap-1 justify-center">
                      <Link href={`/chat?with=${friend.id}&tab=personal`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          title="Сообщение"
                          aria-label="Сообщение"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </Link>
                      {friendProfileHref(friend) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          asChild
                          title="Профиль"
                          aria-label="Профиль"
                        >
                          <Link href={friendProfileHref(friend)!}>
                            <UserCheck className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        title="Удалить"
                        aria-label="Удалить из друзей"
                        onClick={() => removeFriendMutation.mutate(friend.id)}
                        disabled={removeFriendMutation.isPending}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search tab */}
          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-1.5 ait-glass rounded-full p-1 w-fit">
              <span className="text-sm text-muted-foreground w-full px-2 pt-1">{t("friends.directionLabel")}</span>
              <Button
                size="sm"
                variant={discoverDirection === "" ? "premium" : "filter"}
                onClick={() => setDiscoverDirection("")}
              >
                {t("friends.anyDirection")}
              </Button>
              {TRAVEL_DIRECTIONS.map((d) => (
                <Button
                  key={d.id}
                  size="sm"
                  variant={discoverDirection === d.id ? "premium" : "filter"}
                  onClick={() => setDiscoverDirection(d.id)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Поиск пользователей</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="@ник или имя..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {activeSearch && searchResults.length === 0 && !isSearching && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Пользователи не найдены</p>
                </CardContent>
              </Card>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults
                  .filter((r) => r.id !== user?.id)
                  .map((result) => {
                    const alreadyFriend = friends.some((f) => f.id === result.id);
                    const requestSent = isSentRequest(result.id);
                    return (
                      <Card key={result.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={resolveMediaUrl(result.profileImageUrl)} />
                                <AvatarFallback className="bg-primary/20 text-foreground font-semibold">
                                  {getUserInitial(result)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                {result.username ? (
                                  <Link href={`/u/${result.username}`}>
                                    <h3 className="font-semibold hover:underline">
                                      {getUserDisplayLabel(result)}
                                    </h3>
                                  </Link>
                                ) : (
                                  <h3 className="font-semibold">{getUserDisplayLabel(result)}</h3>
                                )}
                                {getUserHandle(result) && (
                                  <p className="text-sm text-ait-purple">{getUserHandle(result)}</p>
                                )}
                              </div>
                            </div>
                            {alreadyFriend ? (
                              <div className="flex gap-2 items-center">
                                <Badge variant="secondary">
                                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                                  Друг
                                </Badge>
                                <FollowButton userId={result.id} />
                              </div>
                            ) : requestSent ? (
                              <div className="flex gap-2 items-center">
                                <Badge variant="outline">Запрос отправлен</Badge>
                                <FollowButton userId={result.id} />
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <FollowButton userId={result.id} />
                                <Button
                                  size="sm"
                                  variant="premium"
                                  onClick={() => sendRequestMutation.mutate(result.id)}
                                  disabled={sendRequestMutation.isPending}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Добавить
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          {/* Received requests tab */}
          <TabsContent value="received" className="space-y-4 mt-4">
            {receivedError ? (
              <EmptyState
                icon={AlertCircle}
                title="Не удалось загрузить запросы"
                action={
                  <Button variant="outline" onClick={() => refetchReceived()}>
                    Повторить
                  </Button>
                }
              />
            ) : receivedLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-24 animate-pulse bg-muted" />
                ))}
              </div>
            ) : receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет входящих запросов</h3>
                  <p className="text-muted-foreground">Входящие запросы появятся здесь</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={resolveMediaUrl(request.user?.profileImageUrl)} />
                            <AvatarFallback className="bg-primary/20 text-foreground font-semibold">
                              {request.user ? getUserInitial(request.user) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {request.user ? getUserDisplayLabel(request.user) : "Пользователь"}
                            </h3>
                            {request.user && getUserHandle(request.user) && (
                              <p className="text-sm text-ait-purple">
                                {getUserHandle(request.user)}
                              </p>
                            )}
                            <Badge variant="secondary" className="mt-1">
                              Входящий запрос
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              respondToRequestMutation.mutate({
                                friendshipId: request.id,
                                status: "accepted",
                              })
                            }
                            disabled={respondToRequestMutation.isPending}
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Принять
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              respondToRequestMutation.mutate({
                                friendshipId: request.id,
                                status: "rejected",
                              })
                            }
                            disabled={respondToRequestMutation.isPending}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent requests tab */}
          <TabsContent value="sent" className="space-y-4 mt-4">
            {sentError ? (
              <EmptyState
                icon={AlertCircle}
                title="Не удалось загрузить запросы"
                action={
                  <Button variant="outline" onClick={() => refetchSent()}>
                    Повторить
                  </Button>
                }
              />
            ) : sentLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-24 animate-pulse bg-muted" />
                ))}
              </div>
            ) : sentRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <h3 className="text-lg font-semibold mb-2">Нет отправленных запросов</h3>
                  <p className="text-muted-foreground">Отправленные запросы появятся здесь</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={resolveMediaUrl(request.user?.profileImageUrl)} />
                            <AvatarFallback className="bg-primary/20 text-foreground font-semibold">
                              {request.user ? getUserInitial(request.user) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {request.user ? getUserDisplayLabel(request.user) : "Пользователь"}
                            </h3>
                            {request.user && getUserHandle(request.user) && (
                              <p className="text-sm text-ait-purple">
                                {getUserHandle(request.user)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">Ожидает ответа</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </PageShell>
      </div>
    </AppLayout>
  );
}

export default Friends;
