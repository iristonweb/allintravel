import { useState } from "react";
import { Link, useSearch } from "wouter";
import { TRAVEL_DIRECTIONS } from "@shared/travel-directions";
import type { TravelDirectionId } from "@shared/travel-directions";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import EmptyState from "@/components/empty-state";
import FriendGridSkeleton from "@/components/friends/FriendGridSkeleton";
import FriendRequestSkeleton from "@/components/friends/FriendRequestSkeleton";
import { Button } from "@/components/ui/button";
import SmartSearchField from "@/components/search/SmartSearchField";
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
      toast({
        title: status === "accepted" ? t("friends.requestAccepted") : t("friends.requestDeclined"),
      });
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
          <h1 className="text-2xl font-bold mb-4">{t("friends.signInRequired")}</h1>
          <p className="text-muted-foreground">{t("friends.signInHint")}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout rightRail={<DiscoveryRightRail />}>
      <div className="max-w-4xl mx-auto">
        <ReelsPageLayout
          header={
            <div className="space-y-2">
              <Link
                href="/profile"
                className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
              >
                ← {t("friends.breadcrumbProfile")}
              </Link>
              <AitSectionHeader title={t("friends.title")} description={t("friends.description")} />
            </div>
          }
          feed={
            <>
              {primaryTripId && <TripRouteMatches tripId={primaryTripId} className="mb-6" />}

              <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="friends">
                    <Users className="mr-2 h-4 w-4" />
                    {t("friends.tabFriends")} ({friends.length})
                  </TabsTrigger>
                  <TabsTrigger value="search">
                    <Search className="mr-2 h-4 w-4" />
                    {t("friends.tabSearch")}
                  </TabsTrigger>
                  <TabsTrigger value="received">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("friends.tabReceived")} ({receivedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent">
                    {t("friends.tabSent")} ({sentRequests.length})
                  </TabsTrigger>
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
                      variant="glass"
                      icon={AlertCircle}
                      title={t("friends.loadError")}
                      description={t("friends.connectionError")}
                      action={
                        <AitButton variant="glass" size="sm" onClick={() => refetchFriends()}>
                          {t("common.retry")}
                        </AitButton>
                      }
                    />
                  ) : friendsLoading ? (
                    <FriendGridSkeleton />
                  ) : friends.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      icon={Users}
                      title={t("friends.emptyFriendsTitle")}
                      description={t("friends.emptyFriendsHint")}
                    />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {friends.map((friend) => (
                        <AitSurface key={friend.id} padding="sm" className="flex flex-col gap-2">
                          <UserPreviewCell user={friend} />
                          <div className="flex gap-1 justify-center">
                            <Link href={`/chat?with=${friend.id}&tab=personal`}>
                              <AitButton
                                size="sm"
                                variant="glass"
                                className="h-8 px-2"
                                title={t("friends.message")}
                                aria-label={t("friends.message")}
                              >
                                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                              </AitButton>
                            </Link>
                            {friendProfileHref(friend) ? (
                              <AitButton
                                size="sm"
                                variant="glass"
                                className="h-8 px-2"
                                asChild
                                title={t("friends.profile")}
                                aria-label={t("friends.profile")}
                              >
                                <Link href={friendProfileHref(friend)!}>
                                  <UserCheck className="h-4 w-4" strokeWidth={1.5} />
                                </Link>
                              </AitButton>
                            ) : null}
                            <AitButton
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-muted-foreground hover:text-destructive"
                              title={t("friends.remove")}
                              aria-label={t("friends.removeFromFriends")}
                              onClick={() => removeFriendMutation.mutate(friend.id)}
                              disabled={removeFriendMutation.isPending}
                            >
                              <UserX className="h-4 w-4" strokeWidth={1.5} />
                            </AitButton>
                          </div>
                        </AitSurface>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Search tab */}
                <TabsContent value="search" className="space-y-4 mt-4">
                  <div className="flex flex-wrap gap-1.5 ait-glass rounded-full p-1 w-fit">
                    <span className="text-sm text-muted-foreground w-full px-2 pt-1">
                      {t("friends.directionLabel")}
                    </span>
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
                  <AitSurface padding="sm">
                    <h3 className="font-semibold mb-3">{t("friends.searchUsersTitle")}</h3>
                    <div className="flex gap-2">
                      <SmartSearchField
                        className="flex-1"
                        placeholder={t("friends.searchPlaceholder")}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <AitButton
                        onClick={handleSearch}
                        disabled={isSearching}
                        variant="primary"
                        size="sm"
                      >
                        <Search className="h-4 w-4" strokeWidth={1.5} />
                      </AitButton>
                    </div>
                  </AitSurface>

                  {isSearching && <FriendGridSkeleton />}

                  {activeSearch && searchResults.length === 0 && !isSearching && (
                    <EmptyState
                      variant="glass"
                      icon={Search}
                      title={t("friends.noUsersFound")}
                      className="py-8"
                    />
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="space-y-3">
                      {searchResults
                        .filter((r) => r.id !== user?.id)
                        .map((result) => {
                          const alreadyFriend = friends.some((f) => f.id === result.id);
                          const requestSent = isSentRequest(result.id);
                          return (
                            <AitSurface key={result.id} padding="sm">
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
                                      <h3 className="font-semibold">
                                        {getUserDisplayLabel(result)}
                                      </h3>
                                    )}
                                    {getUserHandle(result) && (
                                      <p className="text-sm text-ait-purple">
                                        {getUserHandle(result)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {alreadyFriend ? (
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="secondary">
                                      <UserCheck className="mr-1 h-3.5 w-3.5" />
                                      {t("friends.friendBadge")}
                                    </Badge>
                                    <FollowButton userId={result.id} />
                                  </div>
                                ) : requestSent ? (
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="outline">{t("friends.requestSentBadge")}</Badge>
                                    <FollowButton userId={result.id} />
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <FollowButton userId={result.id} />
                                    <AitButton
                                      size="sm"
                                      variant="primary"
                                      onClick={() => sendRequestMutation.mutate(result.id)}
                                      disabled={sendRequestMutation.isPending}
                                    >
                                      <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                      {t("friends.addFriend")}
                                    </AitButton>
                                  </div>
                                )}
                              </div>
                            </AitSurface>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>

                {/* Received requests tab */}
                <TabsContent value="received" className="space-y-4 mt-4">
                  {receivedError ? (
                    <EmptyState
                      variant="glass"
                      icon={AlertCircle}
                      title={t("friends.loadRequestsError")}
                      action={
                        <AitButton variant="glass" size="sm" onClick={() => refetchReceived()}>
                          {t("common.retry")}
                        </AitButton>
                      }
                    />
                  ) : receivedLoading ? (
                    <FriendRequestSkeleton />
                  ) : receivedRequests.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      icon={UserPlus}
                      title={t("friends.noReceivedTitle")}
                      description={t("friends.noReceivedHint")}
                    />
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests.map((request) => (
                        <AitSurface key={request.id} padding="sm">
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
                                  {request.user
                                    ? getUserDisplayLabel(request.user)
                                    : t("friends.userFallback")}
                                </h3>
                                {request.user && getUserHandle(request.user) && (
                                  <p className="text-sm text-ait-purple">
                                    {getUserHandle(request.user)}
                                  </p>
                                )}
                                <Badge variant="secondary" className="mt-1">
                                  {t("friends.incomingRequest")}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <AitButton
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  respondToRequestMutation.mutate({
                                    friendshipId: request.id,
                                    status: "accepted",
                                  })
                                }
                                disabled={respondToRequestMutation.isPending}
                              >
                                <UserCheck className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                {t("friends.accept")}
                              </AitButton>
                              <AitButton
                                size="sm"
                                variant="glass"
                                onClick={() =>
                                  respondToRequestMutation.mutate({
                                    friendshipId: request.id,
                                    status: "rejected",
                                  })
                                }
                                disabled={respondToRequestMutation.isPending}
                              >
                                <UserX className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                {t("friends.decline")}
                              </AitButton>
                            </div>
                          </div>
                        </AitSurface>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Sent requests tab */}
                <TabsContent value="sent" className="space-y-4 mt-4">
                  {sentError ? (
                    <EmptyState
                      variant="glass"
                      icon={AlertCircle}
                      title={t("friends.loadRequestsError")}
                      action={
                        <AitButton variant="glass" size="sm" onClick={() => refetchSent()}>
                          {t("common.retry")}
                        </AitButton>
                      }
                    />
                  ) : sentLoading ? (
                    <FriendRequestSkeleton />
                  ) : sentRequests.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      title={t("friends.noSentTitle")}
                      description={t("friends.noSentHint")}
                    />
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((request) => (
                        <AitSurface key={request.id} padding="sm">
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
                                  {request.user
                                    ? getUserDisplayLabel(request.user)
                                    : t("friends.userFallback")}
                                </h3>
                                {request.user && getUserHandle(request.user) && (
                                  <p className="text-sm text-ait-purple">
                                    {getUserHandle(request.user)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline">{t("friends.awaitingResponse")}</Badge>
                          </div>
                        </AitSurface>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          }
        />
      </div>
    </AppLayout>
  );
}

export default Friends;
