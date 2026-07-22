import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import ProfileHeroSkeleton from "@/components/profile/ProfileHeroSkeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Camera,
  Globe,
  Edit,
  Star,
  Calendar,
  Heart,
  Users,
  AlertCircle,
} from "lucide-react";
import EmptyState from "@/components/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type {
  UserProfile,
  TravelPostWithAuthor,
  UserFavoriteWithPlace,
  ReviewWithPlace,
  Trip,
} from "@shared/schema";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { validateUsername } from "@shared/username";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { uploadUserAvatar } from "@/lib/upload-media";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notifyUrlSearchChange } from "@/hooks/useUrlSearch";
import { useTranslation } from "react-i18next";

const PROFILE_TABS = ["posts", "trips", "reviews", "favorites"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function profileTabFromSearch(search: string): ProfileTab {
  const tab = new URLSearchParams(search).get("tab");
  return PROFILE_TABS.includes(tab as ProfileTab) ? (tab as ProfileTab) : "posts";
}

export function ProfileEdit() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
  const searchString = useSearch();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => profileTabFromSearch(searchString));

  useEffect(() => {
    setActiveTab(profileTabFromSearch(searchString));
  }, [searchString]);

  const handleProfileTabChange = (tab: string) => {
    const next = tab as ProfileTab;
    setActiveTab(next);
    const url = new URL(window.location.href);
    if (next === "posts") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    const search = url.searchParams.toString();
    window.history.replaceState({}, "", url.pathname + (search ? `?${search}` : ""));
    notifyUrlSearchChange();
  };

  const avatarUploadMutation = useMutation({
    mutationFn: (file: File) => uploadUserAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t("profileEdit.toast.avatarUpdated") });
    },
    onError: (err: Error) => {
      toast({
        title: t("profileEdit.toast.avatarFailed"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarUploadMutation.mutate(file);
  };
  const [profileData, setProfileData] = useState({
    bio: "",
    location: "",
    travelStyle: "",
    isPublic: true,
  });

  const [accountData, setAccountData] = useState({
    username: "",
    displayName: "",
    firstName: "",
    lastName: "",
  });

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery<UserProfile | null>({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: userPosts = [], isLoading: postsLoading } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { userId: user?.id }],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: userTrips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { userId: user?.id }],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: favorites = [], isLoading: favLoading } = useQuery<UserFavoriteWithPlace[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<ReviewWithPlace[]>({
    queryKey: ["/api/reviews/user"],
    enabled: isAuthenticated,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        bio: profile.bio || "",
        location: profile.location || "",
        travelStyle: profile.travelStyle || "",
        isPublic: profile.isPublic ?? true,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      setAccountData({
        username: user.username ?? "",
        displayName: user.displayName ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
      });
    }
  }, [user]);

  const updateAccountMutation = useMutation({
    mutationFn: async (data: typeof accountData) => {
      const parsed = validateUsername(data.username);
      if (!parsed.ok) throw new Error(parsed.message);
      return apiRequestJson("PUT", "/api/users/me", {
        username: parsed.value,
        displayName: data.displayName.trim() || null,
        firstName: data.firstName.trim() || null,
        lastName: data.lastName.trim() || null,
      });
    },
    onSuccess: () => {
      toast({ title: t("profileEdit.toast.accountUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (err: Error) => {
      toast({
        title: t("profileEdit.toast.saveFailed"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) =>
      apiRequest(profile ? "PUT" : "POST", "/api/profile", data),
    onSuccess: () => {
      toast({ title: t("profileEdit.toast.profileUpdated") });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
    },
    onError: () => {
      toast({ title: t("profileEdit.toast.profileUpdateFailed"), variant: "destructive" });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (placeId: string) => apiRequest("DELETE", `/api/favorites/${placeId}`),
    onSuccess: () => {
      toast({ title: t("profileEdit.toast.favoriteRemoved") });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({ title: t("profileEdit.toast.favoriteRemoveFailed"), variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <EmptyState
          variant="glass"
          title={t("profileEdit.signInRequired")}
          description={t("profileEdit.signInHint")}
          className="max-w-md mx-auto"
        />
      </AppLayout>
    );
  }

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
      />
    ));

  if (profileLoading) {
    return (
      <AppLayout rightRail={<DiscoveryRightRail />}>
        <div className="max-w-4xl mx-auto" aria-label={t("profileEdit.loading")}>
          <ProfileHeroSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (profileError) {
    return (
      <AppLayout rightRail={<DiscoveryRightRail />}>
        <div className="max-w-4xl mx-auto">
          <EmptyState
            variant="glass"
            icon={AlertCircle}
            title={t("profileEdit.loadError")}
            action={
              <AitButton variant="glass" size="sm" onClick={() => refetchProfile()}>
                {t("common.retry")}
              </AitButton>
            }
          />
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
                ← {t("profileEdit.breadcrumbProfile")}
              </Link>
              <AitSectionHeader title={t("profileEdit.breadcrumbEdit")} />
            </div>
          }
          feed={
            <>
              <AitSurface className="mb-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
                        <AvatarFallback className="text-3xl">
                          {user ? getUserInitial(user) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <AitButton
                        size="icon"
                        variant="glass"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        asChild
                      >
                        <label
                          className="cursor-pointer"
                          aria-label={t("profileEdit.uploadAvatar")}
                        >
                          <Camera className="h-4 w-4" strokeWidth={1.5} />
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,.gif"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      </AitButton>
                    </div>
                    {user?.profileImageUrl?.startsWith("/uploads/") && (
                      <Alert className="mt-3 max-w-xs text-left">
                        <AlertDescription className="text-xs">
                          {t("profileEdit.legacyAvatarHint")}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <img
                            src="/brand/logo-mark.png"
                            alt="All-in-travel"
                            className="h-9 w-9 shrink-0"
                            loading="lazy"
                          />
                          <h1 className="text-2xl font-bold">
                            {user ? getUserDisplayLabel(user) : t("profileEdit.profileFallback")}
                          </h1>
                          {(user as { isVerified?: boolean })?.isVerified && (
                            <Badge className="bg-green-500/15 text-green-500 border border-green-500/30">
                              {t("profileEdit.verified")}
                            </Badge>
                          )}
                        </div>
                        {user && getUserHandle(user) && (
                          <p className="text-sm text-ait-purple font-medium">
                            {getUserHandle(user)}
                          </p>
                        )}
                        <p className="text-muted-foreground text-sm">{user?.email}</p>
                        {profile?.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {profile.location}
                            </span>
                          </div>
                        )}
                        {profile?.travelStyle && (
                          <Badge variant="secondary" className="mt-2">
                            {profile.travelStyle}
                          </Badge>
                        )}
                      </div>
                      <AitButton variant="glass" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        <Edit className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        {t("profileEdit.edit")}
                      </AitButton>
                    </div>

                    {profile?.bio && (
                      <p className="text-muted-foreground mb-4 leading-relaxed">{profile.bio}</p>
                    )}

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{userPosts.length}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("profileEdit.statsPosts")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{userTrips.length}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("profileEdit.statsTrips")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{favorites.length}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("profileEdit.statsFavorites")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {(friends as unknown[]).length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("profileEdit.statsFriends")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AitSurface>

              {!user?.username && (
                <Alert className="mb-6 border-ait-purple/30 bg-ait-purple/10">
                  <AlertDescription>{t("profileEdit.usernameHint")}</AlertDescription>
                </Alert>
              )}

              {isEditing && (
                <AitSurface className="mb-8 space-y-4">
                  <h2 className="text-lg font-semibold">{t("profileEdit.editTitle")}</h2>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-border/60">
                      <div>
                        <Label htmlFor="username">{t("profileEdit.usernameLabel")}</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            @
                          </span>
                          <Input
                            id="username"
                            className="pl-7"
                            placeholder={t("profileEdit.usernamePlaceholder")}
                            value={accountData.username}
                            onChange={(e) =>
                              setAccountData({
                                ...accountData,
                                username: e.target.value.replace(/^@/, ""),
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("profileEdit.usernameRules")}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="displayName">{t("profileEdit.displayNameLabel")}</Label>
                        <Input
                          id="displayName"
                          placeholder={t("profileEdit.displayNamePlaceholder")}
                          value={accountData.displayName}
                          onChange={(e) =>
                            setAccountData({ ...accountData, displayName: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="firstName">{t("profileEdit.firstName")}</Label>
                        <Input
                          id="firstName"
                          value={accountData.firstName}
                          onChange={(e) =>
                            setAccountData({ ...accountData, firstName: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t("profileEdit.lastName")}</Label>
                        <Input
                          id="lastName"
                          value={accountData.lastName}
                          onChange={(e) =>
                            setAccountData({ ...accountData, lastName: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <AitButton
                          type="button"
                          variant="glass"
                          size="sm"
                          onClick={() => updateAccountMutation.mutate(accountData)}
                          disabled={updateAccountMutation.isPending}
                        >
                          {t("profileEdit.saveAccount")}
                        </AitButton>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio">{t("profileEdit.bioLabel")}</Label>
                      <Textarea
                        id="bio"
                        placeholder={t("profileEdit.bioPlaceholder")}
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">{t("profileEdit.locationLabel")}</Label>
                      <LocationAutocompleteInput
                        id="location"
                        placeholder={t("profileEdit.locationPlaceholder")}
                        value={profileData.location}
                        onChange={(v) => setProfileData({ ...profileData, location: v })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="travelStyle">{t("profileEdit.travelStyleLabel")}</Label>
                      <Input
                        id="travelStyle"
                        placeholder={t("profileEdit.travelStylePlaceholder")}
                        value={profileData.travelStyle}
                        onChange={(e) =>
                          setProfileData({ ...profileData, travelStyle: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <AitButton
                        onClick={() => updateProfileMutation.mutate(profileData)}
                        disabled={updateProfileMutation.isPending}
                        variant="primary"
                        size="sm"
                      >
                        {t("profileEdit.save")}
                      </AitButton>
                      <AitButton variant="glass" size="sm" onClick={() => setIsEditing(false)}>
                        {t("profileEdit.cancel")}
                      </AitButton>
                    </div>
                  </div>
                </AitSurface>
              )}

              <Tabs value={activeTab} onValueChange={handleProfileTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="posts">{t("profileEdit.tabs.posts")}</TabsTrigger>
                  <TabsTrigger value="trips">{t("profileEdit.tabs.trips")}</TabsTrigger>
                  <TabsTrigger value="reviews">{t("profileEdit.tabs.reviews")}</TabsTrigger>
                  <TabsTrigger value="favorites">{t("profileEdit.tabs.favorites")}</TabsTrigger>
                </TabsList>

                {/* Posts tab */}
                <TabsContent value="posts" className="mt-6">
                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : userPosts.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      icon={Globe}
                      title={t("profileEdit.empty.postsTitle")}
                      description={t("profileEdit.empty.postsHint")}
                      action={
                        <AitButton variant="primary" size="sm" asChild>
                          <Link href="/social-feed">{t("profileEdit.empty.postsCta")}</Link>
                        </AitButton>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userPosts.map((post) => (
                        <AitSurface key={post.id} padding="sm">
                          <h3 className="text-lg font-semibold">{post.title}</h3>
                          {post.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                              <span className="text-sm text-muted-foreground">{post.location}</span>
                            </div>
                          )}
                          <p className="text-muted-foreground line-clamp-3 mb-3 mt-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" strokeWidth={1.5} /> {post.likesCount}
                            </span>
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex gap-1">
                                {post.tags.slice(0, 2).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </AitSurface>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Trips tab */}
                <TabsContent value="trips" className="mt-6">
                  {tripsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : userTrips.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      icon={Calendar}
                      title={t("profileEdit.empty.tripsTitle")}
                      description={t("profileEdit.empty.tripsHint")}
                      action={
                        <AitButton variant="primary" size="sm" asChild>
                          <Link href="/trips">{t("profileEdit.empty.tripsCta")}</Link>
                        </AitButton>
                      }
                    />
                  ) : (
                    <div className="grid gap-4">
                      {userTrips.map((trip) => (
                        <AitSurface key={trip.id} padding="sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{trip.title}</h3>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin
                                  className="h-4 w-4 text-muted-foreground"
                                  strokeWidth={1.5}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {trip.destination}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(
                                  new Date(trip.startDate as unknown as string),
                                  "d MMM yyyy",
                                  {
                                    locale: dateLocale,
                                  },
                                )}
                                {" – "}
                                {format(new Date(trip.endDate as unknown as string), "d MMM yyyy", {
                                  locale: dateLocale,
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" strokeWidth={1.5} />
                                {trip.currentParticipants}/{trip.maxParticipants}
                              </div>
                              {trip.tags && trip.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2 justify-end">
                                  {trip.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </AitSurface>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Reviews tab */}
                <TabsContent value="reviews" className="mt-6">
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      icon={Star}
                      title={t("profileEdit.empty.reviewsTitle")}
                      description={t("profileEdit.empty.reviewsHint")}
                    />
                  ) : (
                    <div className="grid gap-4">
                      {reviews.map((review) => (
                        <AitSurface key={review.id} padding="sm">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {review.place?.name || t("profileEdit.placeFallback")}
                              </h3>
                              {review.place?.address && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {review.place.address}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.title && (
                            <p className="font-medium text-sm mb-1">{review.title}</p>
                          )}
                          {review.content && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {review.content}
                            </p>
                          )}
                        </AitSurface>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                  {favLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : favorites.length === 0 ? (
                    <EmptyState
                      variant="glass"
                      icon={Heart}
                      title={t("profileEdit.empty.favoritesTitle")}
                      description={t("profileEdit.empty.favoritesHint")}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.map((fav) => (
                        <AitSurface key={fav.id} padding="sm">
                          <div className="flex items-start gap-3">
                            {fav.place?.imageUrl && (
                              <img
                                src={fav.place.imageUrl}
                                alt={fav.place.name}
                                className="h-16 w-16 object-cover rounded-card-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">
                                {fav.place?.name || t("profileEdit.placeFallback")}
                              </h3>
                              {fav.place?.address && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground truncate">
                                    {fav.place.address}
                                  </span>
                                </div>
                              )}
                              {fav.place?.averageRating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">
                                    {fav.place.averageRating}
                                  </span>
                                </div>
                              )}
                            </div>
                            <AitButton
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFavoriteMutation.mutate(fav.placeId)}
                              disabled={removeFavoriteMutation.isPending}
                              className="text-muted-foreground hover:text-red-500 flex-shrink-0"
                              aria-label={t("places.card.favoriteRemove")}
                            >
                              <Heart
                                className="h-4 w-4 fill-current text-red-500"
                                strokeWidth={1.5}
                              />
                            </AitButton>
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

export default ProfileEdit;
