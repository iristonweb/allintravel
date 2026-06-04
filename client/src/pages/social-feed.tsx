import { useRef, useState, useMemo, useEffect } from "react";
import { feedModeFromQuery, filterPostsForFeedMode, type FeedMode } from "@/lib/feed-utils";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Plus,
  Compass,
  Send,
  Bookmark,
  Film,
  BookMarked,
  Sparkles,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
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
import { uploadMediaFile, isVideoUrl } from "@/lib/upload-media";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PostFormat } from "@shared/post-formats";
import StoryBar, { type StoryGroup } from "@/components/feed/StoryBar";
import StoryViewer from "@/components/feed/StoryViewer";
import ReelFeed from "@/components/feed/ReelFeed";
import JournalCard from "@/components/feed/JournalCard";
import { isVideoUrl as isVideoUrlShared } from "@shared/post-formats";

function contentFormatToApi(format: "feed" | "stories" | "reels" | "journals"): PostFormat {
  if (format === "stories") return "story";
  if (format === "reels") return "reel";
  if (format === "journals") return "journal";
  return "post";
}

export function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedMode, setFeedMode] = useState<FeedMode>(() => {
    const fromUrl = feedModeFromQuery(new URLSearchParams(window.location.search).get("mode"));
    return fromUrl;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("mode") && isAuthenticated) {
      setFeedMode("following");
    } else {
      setFeedMode(feedModeFromQuery(params.get("mode")));
    }
  }, [isAuthenticated]);

  const setFeedModeWithUrl = (mode: FeedMode) => {
    setFeedMode(mode);
    const url = new URL(window.location.href);
    if (mode === "all") url.searchParams.delete("mode");
    else url.searchParams.set("mode", mode);
    window.history.replaceState({}, "", url.pathname + url.search);
  };
  const [contentFormat, setContentFormat] = useState<"feed" | "stories" | "reels" | "journals">("feed");
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
    images: [] as string[],
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [storyView, setStoryView] = useState<{
    posts: TravelPostWithAuthor[];
    index: number;
  } | null>(null);

  const apiFormat = contentFormatToApi(contentFormat);

  const postsQueryParams = useMemo(() => {
    const base: Record<string, string> = { format: apiFormat };
    if (activeTag) base.tag = activeTag;
    if (user?.id && (feedMode === "following" || feedMode === "all")) {
      base.following = user.id;
    }
    return base;
  }, [apiFormat, activeTag, feedMode, user?.id]);

  const { data: posts = [], isLoading } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", postsQueryParams],
    enabled: isAuthenticated && (feedMode !== "following" || !!user?.id),
    refetchInterval: isAuthenticated ? 20_000 : false,
  });

  const displayedPosts = useMemo(() => filterPostsForFeedMode(posts, feedMode), [posts, feedMode]);

  const createPostMutation = useMutation({
    mutationFn: (postData: {
      format: PostFormat;
      title: string;
      content: string;
      location: string;
      tags: string[];
      isPublic: boolean;
      images?: string[];
    }) => apiRequest("POST", "/api/posts", postData),
    onSuccess: () => {
      toast({ title: "Пост опубликован!" });
      setIsCreating(false);
      setNewPost({
        title: "",
        content: "",
        location: "",
        tags: [],
        tagInput: "",
        isPublic: true,
        images: [],
      });
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
    const format = apiFormat;
    const { tagInput, images, ...postData } = newPost;

    if (format === "story") {
      if (!images.length) {
        toast({ title: "Добавьте фото или видео для Story", variant: "destructive" });
        return;
      }
      createPostMutation.mutate({
        format,
        ...postData,
        title: "",
        content: postData.content.trim() || " ",
        images,
      });
      return;
    }

    if (format === "reel") {
      if (!images.some(isVideoUrlShared)) {
        toast({ title: "Reel требует видеофайл", variant: "destructive" });
        return;
      }
      createPostMutation.mutate({
        format,
        ...postData,
        title: "",
        content: postData.content.trim() || " ",
        images,
      });
      return;
    }

    if (format === "journal") {
      if (!newPost.title.trim()) {
        toast({ title: "Укажите заголовок журнала", variant: "destructive" });
        return;
      }
      if (newPost.content.trim().length < 80) {
        toast({ title: "Текст журнала — минимум 80 символов", variant: "destructive" });
        return;
      }
      createPostMutation.mutate({
        format,
        ...postData,
        isPublic: true,
        images: images.length > 0 ? images : undefined,
      });
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({ title: "Заполните заголовок и текст поста", variant: "destructive" });
      return;
    }
    createPostMutation.mutate({
      format: "post",
      ...postData,
      images: images.length > 0 ? images : undefined,
    });
  };

  const openStoryGroup = (group: StoryGroup, startIndex: number) => {
    setStoryView({ posts: group.posts, index: startIndex });
  };

  const composerPlaceholder =
    contentFormat === "stories"
      ? "Новая Story (24ч)..."
      : contentFormat === "reels"
        ? "Новый Reel..."
        : contentFormat === "journals"
          ? "Запись в журнал..."
          : "Поделитесь впечатлениями от путешествия...";

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploadingMedia(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadMediaFile(file));
      }
      setNewPost((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      toast({
        title: "Не удалось загрузить файл",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
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
        <div className="mb-2">
          <h1 className="ait-section-title">Сообщество</h1>
          <p className="text-muted-foreground mt-1">
            Лента путешественников — Stories, Reels и Journals
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-6 mb-4">
          {(
            [
              { id: "feed", label: "Лента", icon: Sparkles },
              { id: "stories", label: "Stories", icon: BookMarked },
              { id: "reels", label: "Reels", icon: Film },
              { id: "journals", label: "Journals", icon: Compass },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={contentFormat === id ? "default" : "ghost"}
              className={
                contentFormat === id
                  ? "rounded-full ait-btn-glow border-0 text-white"
                  : "rounded-full ait-glass text-slate-400"
              }
              onClick={() => setContentFormat(id)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 mb-2 ait-glass rounded-full p-1 w-fit">
          <Button
            variant={feedMode === "all" ? "default" : "ghost"}
            size="sm"
            className={feedMode === "all" ? "rounded-full bg-ait-gradient-cta text-white border-0" : "rounded-full"}
            onClick={() => { setFeedModeWithUrl("all"); setActiveTag(null); }}
          >
            Все
          </Button>
          <Button
            variant={feedMode === "following" ? "default" : "ghost"}
            size="sm"
            className={feedMode === "following" ? "rounded-full bg-ait-gradient-cta text-white border-0" : "rounded-full"}
            onClick={() => { setFeedModeWithUrl("following"); setActiveTag(null); }}
          >
            Подписки
          </Button>
          <Button
            variant={feedMode === "popular" ? "default" : "ghost"}
            size="sm"
            className={feedMode === "popular" ? "rounded-full bg-ait-gradient-cta text-white border-0" : "rounded-full"}
            onClick={() => { setFeedModeWithUrl("popular"); setActiveTag(null); }}
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
                  <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
                  <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {!isCreating ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setIsCreating(true)}
                    >
                      {composerPlaceholder}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {contentFormat !== "stories" && contentFormat !== "reels" && (
                        <Input
                          placeholder={
                            contentFormat === "journals" ? "Заголовок журнала" : "Заголовок поста"
                          }
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        />
                      )}
                      {contentFormat !== "stories" && (
                        <Textarea
                          placeholder={
                            contentFormat === "journals"
                              ? "Длинная запись (мин. 80 символов)..."
                              : contentFormat === "reels"
                                ? "Подпись к Reel (необязательно)"
                                : "Расскажите о путешествии..."
                          }
                          value={newPost.content}
                          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          rows={contentFormat === "journals" ? 8 : 4}
                        />
                      )}
                      {contentFormat === "feed" && (
                        <>
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
                                    setNewPost((prev) => ({
                                      ...prev,
                                      tags: prev.tags.filter((t) => t !== tag),
                                    }))
                                  }
                                >
                                  #{tag} ×
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept={
                          contentFormat === "reels"
                            ? "video/mp4,video/webm,video/quicktime"
                            : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.gif"
                        }
                        multiple={contentFormat !== "reels"}
                        className="hidden"
                        onChange={handleMediaSelect}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingMedia}
                          onClick={() => mediaInputRef.current?.click()}
                        >
                          {uploadingMedia ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ImagePlus className="h-4 w-4 mr-1" />
                          )}
                          {contentFormat === "reels"
                            ? "Видео"
                            : contentFormat === "stories"
                              ? "Фото / видео"
                              : "Фото / видео"}
                        </Button>
                        {contentFormat === "feed" && (
                          <div className="flex items-center gap-2 ml-auto">
                            <Switch
                              id="post-public"
                              checked={newPost.isPublic}
                              onCheckedChange={(checked) =>
                                setNewPost((prev) => ({ ...prev, isPublic: checked }))
                              }
                            />
                            <Label htmlFor="post-public" className="text-sm text-muted-foreground">
                              Публично (в блоге)
                            </Label>
                          </div>
                        )}
                        {contentFormat === "stories" && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            Исчезнет через 24 часа
                          </span>
                        )}
                      </div>
                      {newPost.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newPost.images.map((url) => (
                            <div key={url} className="relative">
                              {isVideoUrl(url) ? (
                                <video src={url} className="h-20 w-28 rounded-lg object-cover" muted />
                              ) : (
                                <img src={url} alt="" className="h-20 w-28 rounded-lg object-cover" />
                              )}
                              <button
                                type="button"
                                className="absolute -top-1 -right-1 rounded-full bg-destructive text-white p-0.5"
                                onClick={() =>
                                  setNewPost((prev) => ({
                                    ...prev,
                                    images: prev.images.filter((u) => u !== url),
                                  }))
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
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

          {storyView && (
            <StoryViewer
              posts={storyView.posts}
              index={storyView.index}
              onClose={() => setStoryView(null)}
              onIndexChange={(index) => setStoryView((s) => (s ? { ...s, index } : null))}
            />
          )}

          {/* Posts list */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto" />
                <p className="text-muted-foreground mt-2">Загружаем посты...</p>
              </div>
            ) : contentFormat === "stories" ? (
              <StoryBar posts={displayedPosts} onOpenGroup={openStoryGroup} />
            ) : contentFormat === "reels" ? (
              <ReelFeed posts={displayedPosts} />
            ) : displayedPosts.length === 0 ? (
              <GlassCard className="py-16 text-center">
                <Compass className="mx-auto h-12 w-12 text-ait-purple mb-4" />
                <h3 className="text-lg font-semibold mb-2">Пока нет публикаций</h3>
                <p className="text-muted-foreground mb-4">Создайте первую запись в этом формате</p>
                <Button variant="premium" onClick={() => setIsCreating(true)}>
                  Создать
                </Button>
              </GlassCard>
            ) : contentFormat === "journals" ? (
              displayedPosts.map((post) => (
                <JournalCard
                  key={post.id}
                  post={post}
                  formatDate={formatDate}
                  onTagClick={(tag) => setActiveTag(activeTag === tag ? null : tag)}
                />
              ))
            ) : (
              displayedPosts.map((post) => (
                <GlassCard key={post.id} className="overflow-hidden">
                  <div className="p-4 pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
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

                    {post.images && post.images.length > 0 && resolveMediaUrl(post.images[0]) ? (
                      <div className="rounded-2xl overflow-hidden mx-1">
                        {isVideoUrl(post.images[0]) ? (
                          <video
                            src={resolveMediaUrl(post.images[0])!}
                            className="w-full h-64 md:h-[420px] object-cover"
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            src={resolveMediaUrl(post.images[0])!}
                            alt={post.title}
                            className="w-full h-64 md:h-[420px] object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div
                        className="rounded-2xl overflow-hidden mx-1 h-64 md:h-[420px] bg-cover bg-center"
                        style={{
                          backgroundImage:
                            "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85')",
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
                            <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
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
