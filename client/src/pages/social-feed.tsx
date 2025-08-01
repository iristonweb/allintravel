import { useState } from "react";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share, MapPin, Camera, Plus, Compass } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    location: "",
    tags: [] as string[],
    isPublic: true,
  });

  // Fetch travel posts from following users
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts", { following: user?.id }],
    enabled: isAuthenticated,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (postData: any) =>
      apiRequest("POST", "/api/posts", postData),
    onSuccess: () => {
      toast({ title: "Пост опубликован!" });
      setIsCreating(false);
      setNewPost({ title: "", content: "", location: "", tags: [], isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: (postId: string) =>
      apiRequest(`/api/posts/${postId}/like`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }

    createPostMutation.mutate(newPost);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMM yyyy, HH:mm", { locale: ru });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
            <p className="text-muted-foreground">Чтобы увидеть ленту, необходимо войти в систему</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Лента путешествий</h1>
            <p className="text-muted-foreground">
              Следите за путешествиями друзей и делитесь своими приключениями
            </p>
          </div>

          {/* Create Post Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || user?.email?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {!isCreating ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setIsCreating(true)}
                    >
                      Поделитесь своими впечатлениями от путешествия...
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        placeholder="Заголовок поста"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Расскажите о своем путешествии..."
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        rows={4}
                      />
                      <Input
                        placeholder="Местоположение (необязательно)"
                        value={newPost.location}
                        onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreatePost}
                          disabled={createPostMutation.isPending}
                          className="bg-coral-500 hover:bg-coral-600"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Опубликовать
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreating(false)}>
                          Отмена
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mx-auto"></div>
                <p className="text-muted-foreground mt-2">Загружаем посты...</p>
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Пока нет постов</h3>
                  <p className="text-muted-foreground mb-4">
                    Подпишитесь на других путешественников или создайте свой первый пост
                  </p>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-coral-500 hover:bg-coral-600"
                  >
                    Создать пост
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map((post: any) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Пользователь</h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        {post.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{post.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{post.content}</p>
                      </div>

                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {post.images.slice(0, 4).map((image: string, index: number) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likePostMutation.mutate(post.id)}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            Нравится
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Комментарии
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}