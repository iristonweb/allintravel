import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { UserProfile, TravelPostWithAuthor, UserFavoriteWithPlace, ReviewWithPlace, Trip } from "@shared/schema";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { validateUsername } from "@shared/username";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { uploadUserAvatar } from "@/lib/upload-media";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";

export function ProfileEdit() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const avatarUploadMutation = useMutation({
    mutationFn: (file: File) => uploadUserAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Аватар обновлён" });
    },
    onError: (err: Error) => {
      toast({
        title: "Не удалось загрузить аватар",
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

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
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
      toast({ title: "Аккаунт обновлён" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Не удалось сохранить",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) =>
      apiRequest(profile ? "PUT" : "POST", "/api/profile", data),
    onSuccess: () => {
      toast({ title: "Профиль обновлён!" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении профиля", variant: "destructive" });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (placeId: string) => apiRequest("DELETE", `/api/favorites/${placeId}`),
    onSuccess: () => {
      toast({ title: "Удалено из избранного" });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы просмотреть профиль, необходимо войти</p>
        </div>
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
          <AppBreadcrumbs
            items={[
              { label: "Профиль", href: "/profile" },
              { label: "Редактирование" },
            ]}
          />

          {/* Profile header card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
                      <AvatarFallback className="text-3xl">
                        {user ? getUserInitial(user) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      asChild
                    >
                      <label className="cursor-pointer">
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,.gif"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </Button>
                  </div>
                  {user?.profileImageUrl?.startsWith("/uploads/") && (
                    <Alert className="mt-3 max-w-xs text-left">
                      <AlertDescription className="text-xs">
                        Старый аватар мог быть утерян после деплоя. Загрузите фото заново — оно
                        сохранится в постоянное хранилище.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <img
                          src="/brand/logo.svg"
                          alt="All-in-travel"
                          className="h-9 w-9 shrink-0"
                          loading="lazy"
                        />
                        <h1 className="text-2xl font-bold">
                          {user ? getUserDisplayLabel(user) : "Профиль"}
                        </h1>
                        {(user as { isVerified?: boolean })?.isVerified && (
                          <Badge className="bg-green-500/15 text-green-500 border border-green-500/30">
                            Проверен
                          </Badge>
                        )}
                      </div>
                      {user && getUserHandle(user) && (
                        <p className="text-sm text-ait-purple font-medium">{getUserHandle(user)}</p>
                      )}
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      {profile?.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{profile.location}</span>
                        </div>
                      )}
                      {profile?.travelStyle && (
                        <Badge variant="secondary" className="mt-2">{profile.travelStyle}</Badge>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                  </div>

                  {profile?.bio && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">{profile.bio}</p>
                  )}

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{userPosts.length}</div>
                      <div className="text-sm text-muted-foreground">Постов</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{userTrips.length}</div>
                      <div className="text-sm text-muted-foreground">Поездок</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{favorites.length}</div>
                      <div className="text-sm text-muted-foreground">Избранных</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{(friends as unknown[]).length}</div>
                      <div className="text-sm text-muted-foreground">Друзей</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!user?.username && (
            <Alert className="mb-6 border-ait-purple/30 bg-ait-purple/10">
              <AlertDescription>
                Укажите @ник в профиле — так друзья смогут найти вас и писать в чатах.
              </AlertDescription>
            </Alert>
          )}

          {/* Edit profile form */}
          {isEditing && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Редактировать профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-border/60">
                  <div>
                    <Label htmlFor="username">@ник (для поиска друзей)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        id="username"
                        className="pl-7"
                        placeholder="alex_travels"
                        value={accountData.username}
                        onChange={(e) =>
                          setAccountData({ ...accountData, username: e.target.value.replace(/^@/, "") })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Латиница, цифры и _, 3–30 символов</p>
                  </div>
                  <div>
                    <Label htmlFor="displayName">Отображаемое имя</Label>
                    <Input
                      id="displayName"
                      placeholder="Как видят вас в чатах"
                      value={accountData.displayName}
                      onChange={(e) => setAccountData({ ...accountData, displayName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={accountData.firstName}
                      onChange={(e) => setAccountData({ ...accountData, firstName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={accountData.lastName}
                      onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateAccountMutation.mutate(accountData)}
                      disabled={updateAccountMutation.isPending}
                    >
                      Сохранить ник и имя
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите о себе и своих увлечениях..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Местоположение</Label>
                  <LocationAutocompleteInput
                    id="location"
                    placeholder="Москва, Россия"
                    value={profileData.location}
                    onChange={(v) => setProfileData({ ...profileData, location: v })}
                  />
                </div>
                <div>
                  <Label htmlFor="travelStyle">Стиль путешествий</Label>
                  <Input
                    id="travelStyle"
                    placeholder="Бюджетные поездки, роскошный отдых, приключения..."
                    value={profileData.travelStyle}
                    onChange={(e) => setProfileData({ ...profileData, travelStyle: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateProfileMutation.mutate(profileData)}
                    disabled={updateProfileMutation.isPending}
                    variant="premium"
                  >
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Отмена</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Посты</TabsTrigger>
              <TabsTrigger value="trips">Поездки</TabsTrigger>
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              <TabsTrigger value="favorites">Избранное</TabsTrigger>
            </TabsList>

            {/* Posts tab */}
            <TabsContent value="posts" className="mt-6">
              {postsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                </div>
              ) : userPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Нет постов</h3>
                    <p className="text-muted-foreground mb-4">Поделитесь своими путешествиями</p>
                    <Link href="/social-feed">
                      <Button variant="premium">Написать пост</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {post.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{post.location}</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3 mb-3">{post.content}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" /> {post.likesCount}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex gap-1">
                              {post.tags.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Trips tab */}
            <TabsContent value="trips" className="mt-6">
              {tripsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                </div>
              ) : userTrips.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Нет поездок</h3>
                    <p className="text-muted-foreground mb-4">Запланируйте первую поездку</p>
                    <Link href="/trips">
                      <Button variant="premium">Найти поездку</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {userTrips.map((trip) => (
                    <Card key={trip.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{trip.title}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{trip.destination}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(trip.startDate as unknown as string), "d MMM yyyy", { locale: ru })}
                              {" – "}
                              {format(new Date(trip.endDate as unknown as string), "d MMM yyyy", { locale: ru })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {trip.currentParticipants}/{trip.maxParticipants}
                            </div>
                            {trip.tags && trip.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 justify-end">
                                {trip.tags.slice(0, 2).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews tab */}
            <TabsContent value="reviews" className="mt-6">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                </div>
              ) : reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Нет отзывов</h3>
                    <p className="text-muted-foreground">Оставьте отзыв о посещённых местах</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{review.place?.name || "Место"}</h3>
                            {review.place?.address && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{review.place.address}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                        {review.content && (
                          <p className="text-sm text-muted-foreground line-clamp-3">{review.content}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Favorites tab */}
            <TabsContent value="favorites" className="mt-6">
              {favLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                </div>
              ) : favorites.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Нет избранных мест</h3>
                    <p className="text-muted-foreground">Добавляйте места в избранное для быстрого доступа</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.map((fav) => (
                    <Card key={fav.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {fav.place?.imageUrl && (
                            <img
                              src={fav.place.imageUrl}
                              alt={fav.place.name}
                              className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{fav.place?.name || "Место"}</h3>
                            {fav.place?.address && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground truncate">{fav.place.address}</span>
                              </div>
                            )}
                            {fav.place?.averageRating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{fav.place.averageRating}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFavoriteMutation.mutate(fav.placeId)}
                            disabled={removeFavoriteMutation.isPending}
                            className="text-muted-foreground hover:text-red-500 flex-shrink-0"
                          >
                            <Heart className="h-4 w-4 fill-current text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
      </div>
    </AppLayout>
  );
}

export default ProfileEdit;
