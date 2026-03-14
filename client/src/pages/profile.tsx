import { useState } from "react";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  MapPin, 
  Camera, 
  Users, 
  MessageCircle, 
  Calendar,
  Star,
  Globe,
  Edit
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, TravelPost, UserFollow, User } from "@shared/schema";

export function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: "",
    location: "",
    favoriteDestinations: [] as string[],
    travelStyle: "",
    languages: [] as string[],
    isPublic: true,
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: userPosts = [] } = useQuery<TravelPost[]>({
    queryKey: ["/api/posts", { userId: user?.id }],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: followers = [] } = useQuery<UserFollow[]>({
    queryKey: [`/api/followers/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: following = [] } = useQuery<UserFollow[]>({
    queryKey: [`/api/following/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) =>
      apiRequest(profile ? "PUT" : "POST", "/api/profile", data),
    onSuccess: () => {
      toast({ title: "Профиль обновлен!" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
            <p className="text-muted-foreground">Чтобы просмотреть профиль, необходимо войти в систему</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} />
                      <AvatarFallback className="text-2xl">
                        {user?.firstName?.[0] || user?.email?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold">
                        {user?.firstName} {user?.lastName}
                      </h1>
                      <p className="text-muted-foreground">{user?.email}</p>
                      {profile?.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{profile.location}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                  </div>

                  {profile?.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{userPosts.length}</div>
                      <div className="text-sm text-muted-foreground">Постов</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{followers.length}</div>
                      <div className="text-sm text-muted-foreground">Подписчиков</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{friends.length}</div>
                      <div className="text-sm text-muted-foreground">Друзей</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Редактировать профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите о себе и своих увлечениях путешествиями..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Местоположение</Label>
                  <Input
                    id="location"
                    placeholder="Москва, Россия"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
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
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Посты</TabsTrigger>
              <TabsTrigger value="trips">Поездки</TabsTrigger>
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              <TabsTrigger value="favorites">Избранное</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {userPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Нет постов</h3>
                    <p className="text-muted-foreground">
                      Поделитесь своими путешествиями с сообществом
                    </p>
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
                        <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trips" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет поездок</h3>
                  <p className="text-muted-foreground">
                    Запланируйте свою первую поездку
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет отзывов</h3>
                  <p className="text-muted-foreground">
                    Оставьте отзыв о посещенных местах
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">Нет избранных мест</h3>
                  <p className="text-muted-foreground">
                    Добавляйте места в избранное для быстрого доступа
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Profile;
