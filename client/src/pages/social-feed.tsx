import { useState } from "react";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, MapPin, Plus, Compass, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { TravelPostWithAuthor } from "@shared/schema";

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
    tagInput: "",
    isPublic: true,
  });
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const { data: posts = [], isLoading } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
  });

  const createPostMutation = useMutation({
    mutationFn: (postData: { title: string; content: string; location: string; tags: string[]; isPublic: boolean }) =>
      apiRequest("POST", "/api/posts", postData),
    onSuccess: () => {
      toast({ title: "Пост опубликован!" });
      setIsCreating(false);
      setNewPost({ title: "", content: "", location: "", tags: [], tagInput: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({ title: "Ошибка при публикации поста", variant: "destructive" });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      isLiked
        ? apiRequest("DELETE", `/api/posts/${postId}/like`)
        : apiRequest("POST", `/api/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiRequest("POST", `/api/posts/${postId}/comments`, { content }),
    onSuccess: (_, variables) => {
      setCommentInputs((prev) => ({ ...prev, [variables.postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Комментарий добавлен" });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({ title: "Заполните заголовок и текст поста", variant: "destructive" });
      return;
    }
    const { tagInput, ...postData } = newPost;
    createPostMutation.mutate(postData);
  };

  const handleAddTag = () => {
    const tag = newPost.tagInput.trim().replace(/^#/, "");
    if (tag && !newPost.tags.includes(tag)) {
      setNewPost((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "d MMM yyyy, HH:mm", { locale: ru });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы увидеть ленту, необходимо войти</p>
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
            <p className="text-muted-foreground">Следите за путешествиями и делитесь своими приключениями</p>
          </div>

          {/* Create post card */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={user?.profileImageUrl ?? undefined} />
                  <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {!isCreating ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setIsCreating(true)}
                    >
                      Поделитесь впечатлениями от путешествия...
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Заголовок поста"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Расскажите о путешествии..."
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
                        <Input
                          placeholder="Добавить тег"
                          value={newPost.tagInput}
                          onChange={(e) => setNewPost({ ...newPost, tagInput: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                        />
                        <Button variant="outline" size="sm" onClick={handleAddTag}>
                          +
                        </Button>
                      </div>
                      {newPost.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {newPost.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() =>
                                setNewPost((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
                              }
                            >
                              #{tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreatePost}
                          disabled={createPostMutation.isPending}
                          className="bg-primary hover:bg-primary/90"
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
            </CardContent>
          </Card>

          {/* Posts list */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Загружаем посты...</p>
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Пока нет постов</h3>
                  <p className="text-muted-foreground mb-4">Создайте первый пост о своём путешествии</p>
                  <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
                    Создать пост
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={post.author?.profileImageUrl ?? undefined} />
                        <AvatarFallback>
                          {post.author?.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {post.author
                              ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "Пользователь"
                              : "Пользователь"}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(post.createdAt as unknown as string)}
                          </span>
                        </div>
                        {post.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{post.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{post.content}</p>
                    </div>

                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {post.images.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">#{tag}</Badge>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            likePostMutation.mutate({ postId: post.id, isLiked: post.isLiked })
                          }
                          disabled={likePostMutation.isPending}
                          className={post.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}
                        >
                          <Heart className={`mr-1.5 h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                          {post.likesCount > 0 ? post.likesCount : "Нравится"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MessageCircle className="mr-1.5 h-4 w-4" />
                          {post.commentsCount > 0 ? post.commentsCount : "Комментарии"}
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedComments[post.id] && (
                      <div className="border-t pt-3 space-y-3">
                        <div className="flex gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.profileImageUrl ?? undefined} />
                            <AvatarFallback>{user?.firstName?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Написать комментарий..."
                              value={commentInputs[post.id] || ""}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && commentInputs[post.id]?.trim()) {
                                  commentMutation.mutate({ postId: post.id, content: commentInputs[post.id] });
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              disabled={!commentInputs[post.id]?.trim() || commentMutation.isPending}
                              onClick={() =>
                                commentMutation.mutate({ postId: post.id, content: commentInputs[post.id] })
                              }
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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

export default SocialFeed;
