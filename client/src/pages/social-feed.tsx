import { useState, useMemo } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, MapPin, Plus, Compass, Send, Bookmark } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { TravelPostWithAuthor } from "@shared/schema";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import PostComments from "@/components/social/PostComments";
import { shareUrl } from "@/lib/share";

export function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedMode, setFeedMode] = useState<"all" | "following" | "popular">("all");
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [activeTag, setActiveTag] = useState<string | null>(null);
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
    queryKey: activeTag
      ? ["/api/posts", { tag: activeTag }]
      : feedMode === "following"
        ? ["/api/posts", { following: user?.id }]
        : ["/api/posts"],
    enabled: isAuthenticated && (feedMode !== "following" || !!user?.id),
  });

  const displayedPosts = useMemo(() => {
    if (feedMode !== "popular") return posts;
    return [...posts].sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
  }, [posts, feedMode]);

  const createPostMutation = useMutation({
    mutationFn: (postData: { title: string; content: string; location: string; tags: string[]; isPublic: boolean }) =>
      apiRequest("POST", "/api/posts", postData),
    onSuccess: () => {
      toast({ title: "Пост опубликован!" });
      setIsCreating(false);
      setNewPost({ title: "", content: "", location: "", tags: [], tagInput: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      const msg = error?.message ?? "";
      const description = msg.includes("401") ? "Войдите в систему" : msg.includes("5") ? "Ошибка сервера. Попробуйте позже." : "Не удалось опубликовать пост";
      toast({ title: "Ошибка при публикации поста", description, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}/comments`] });
      toast({ title: "Комментарий добавлен" });
    },
    onError: (error: Error) => {
      const message = error?.message?.includes("404") ? "Пост не найден" : "Не удалось добавить комментарий";
      toast({ title: "Ошибка", description: message, variant: "destructive" });
    },
  });

  /** Submit comment only if content is non-empty after trim; show toast otherwise. */
  const handleSubmitComment = (postId: string) => {
    const content = (commentInputs[postId] ?? "").trim();
    if (!content) {
      toast({ title: "Введите текст комментария", variant: "destructive" });
      return;
    }
    commentMutation.mutate({ postId, content });
  };

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
      <AppLayout contentClassName="py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы увидеть ленту, необходимо войти</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Сообщество"
          description="Лента путешественников — делитесь впечатлениями и вдохновляйтесь"
        />

        <div className="flex gap-2 mt-6 mb-2 ait-glass rounded-full p-1 w-fit">
          <Button
            variant={feedMode === "all" ? "default" : "ghost"}
            size="sm"
            className={feedMode === "all" ? "rounded-full bg-ait-gradient-cta text-white border-0" : "rounded-full"}
            onClick={() => { setFeedMode("all"); setActiveTag(null); }}
          >
            Лента
          </Button>
          <Button
            variant={feedMode === "following" ? "default" : "ghost"}
            size="sm"
            className={feedMode === "following" ? "rounded-full bg-ait-gradient-cta text-white border-0" : "rounded-full"}
            onClick={() => { setFeedMode("following"); setActiveTag(null); }}
          >
            Подписки
          </Button>
          <Button
            variant={feedMode === "popular" ? "default" : "ghost"}
            size="sm"
            className={feedMode === "popular" ? "rounded-full bg-ait-gradient-cta text-white border-0" : "rounded-full"}
            onClick={() => { setFeedMode("popular"); setActiveTag(null); }}
          >
            Популярное
          </Button>
          {activeTag && (
            <Badge variant="default" className="cursor-pointer" onClick={() => setActiveTag(null)}>
              #{activeTag} ×
            </Badge>
          )}
        </div>

          {/* Create post card */}
          <GlassCard className="mb-6 mt-8 p-4">
            <div className="pt-0">
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
                      <LocationAutocompleteInput
                        placeholder="Местоположение (необязательно)"
                        value={newPost.location}
                        onChange={(v) => setNewPost({ ...newPost, location: v })}
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
            </div>
          </GlassCard>

          {/* Posts list */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto" />
                <p className="text-muted-foreground mt-2">Загружаем посты...</p>
              </div>
            ) : displayedPosts.length === 0 ? (
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
              displayedPosts.map((post) => (
                <GlassCard key={post.id} className="overflow-hidden">
                  <div className="p-4 pb-3">
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
                  </div>

                  <div className="px-4 pb-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{post.content}</p>
                    </div>

                    {post.images && post.images.length > 0 ? (
                      <div className="-mx-4">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-64 md:h-80 object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="-mx-4 h-48 bg-cover bg-center"
                        style={{
                          backgroundImage:
                            "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80')",
                        }}
                      />
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                          >
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareUrl(window.location.href, post.title, post.content.slice(0, 100))}
                          className="text-muted-foreground"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setBookmarked((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className={bookmarked[post.id] ? "text-ait-purple" : "text-muted-foreground"}
                        >
                          <Bookmark className={`h-4 w-4 ${bookmarked[post.id] ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {expandedComments[post.id] && (
                      <div className="border-t pt-3 space-y-3">
                        <PostComments postId={post.id} enabled={expandedComments[post.id]} />
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
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmitComment(post.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              disabled={!commentInputs[post.id]?.trim() || commentMutation.isPending}
                              onClick={() => handleSubmitComment(post.id)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))
            )}
          </div>
      </div>
    </AppLayout>
  );
}

export default SocialFeed;
