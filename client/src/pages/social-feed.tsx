import { useState, useMemo, useEffect } from "react";
import { filterPostsForFeedMode, type FeedMode } from "@/lib/feed-utils";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { TravelPostWithAuthor } from "@shared/schema";
import { uploadMediaFile } from "@/lib/upload-media";
import type { PostFormat } from "@shared/post-formats";
import StoryViewer from "@/components/feed/StoryViewer";
import SocialFormatTabs from "@/components/social/SocialFormatTabs";
import SocialComposer, { type SocialNewPostDraft } from "@/components/social/SocialComposer";
import SocialFeedList from "@/components/social/SocialFeedList";
import { useSocialFeedParams, type SocialContentFormat } from "@/hooks/useSocialFeedParams";
import { useTranslation } from "react-i18next";
import { isVideoUrl as isVideoUrlShared } from "@shared/post-formats";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import CreatorSpotlight from "@/components/ait/CreatorSpotlight";
import AitLeaderboard from "@/components/ait/AitLeaderboard";

const EMPTY_DRAFT: SocialNewPostDraft = {
  title: "",
  content: "",
  location: "",
  tags: [],
  tagInput: "",
  isPublic: true,
  images: [],
};

function contentFormatToApi(format: SocialContentFormat): PostFormat | "public" {
  if (format === "stories") return "story";
  if (format === "reels") return "reel";
  if (format === "journals") return "journal";
  if (format === "public") return "public";
  return "post";
}

export function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const filters = useFilterLabels();
  const queryClient = useQueryClient();
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [newPost, setNewPost] = useState<SocialNewPostDraft>(EMPTY_DRAFT);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [storyView, setStoryView] = useState<{
    posts: TravelPostWithAuthor[];
    index: number;
  } | null>(null);

  const { feedMode, setFeedMode, contentFormat, setContentFormat, isCreating, setIsCreating } =
    useSocialFeedParams(isAuthenticated);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => undefined,
      { maximumAge: 300_000, timeout: 8000 },
    );
  }, []);

  const { data: bookmarkData } = useQuery<{ postIds: string[] }>({
    queryKey: ["/api/bookmarks"],
    enabled: isAuthenticated,
  });
  const bookmarkedSet = new Set(bookmarkData?.postIds ?? []);
  const apiFormat = contentFormatToApi(contentFormat);

  const postsQueryParams = useMemo(() => {
    if (contentFormat === "public") return { public: "1", limit: "30" };
    const base: Record<string, string> = { format: apiFormat as string };
    if (activeTag) base.tag = activeTag;
    if (user?.id && (feedMode === "following" || feedMode === "all")) base.following = user.id;
    return base;
  }, [apiFormat, activeTag, feedMode, user?.id, contentFormat]);

  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", postsQueryParams],
    enabled:
      isAuthenticated && (contentFormat === "public" || feedMode !== "following" || !!user?.id),
    refetchInterval: isAuthenticated ? 20_000 : false,
  });

  const displayedPosts = useMemo(() => {
    if (contentFormat === "public") return posts;
    return filterPostsForFeedMode(posts, feedMode, {
      userLat: userCoords?.lat,
      userLon: userCoords?.lon,
    });
  }, [posts, feedMode, userCoords, contentFormat]);

  const createPostMutation = useMutation({
    mutationFn: (postData: {
      format: PostFormat;
      title: string;
      content: string;
      location: string;
      tags: string[];
      isPublic: boolean;
      images?: string[];
    }) => apiRequestJson("POST", "/api/posts", postData),
    onSuccess: () => {
      toast({ title: t("social.toasts.published") });
      setIsCreating(false);
      setNewPost(EMPTY_DRAFT);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
    },
    onError: (err: Error) => {
      const msg = err?.message ?? "";
      const description = msg.includes("401")
        ? t("social.toasts.signInRequired")
        : msg.includes("5")
          ? t("social.toasts.serverError")
          : t("social.toasts.publishFailed");
      toast({ title: t("social.toasts.publishErrorTitle"), description, variant: "destructive" });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
        return null;
      }
      return apiRequestJson("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiRequestJson("POST", `/api/posts/${postId}/comments`, { content }),
    onSuccess: (_, variables) => {
      setCommentInputs((prev) => ({ ...prev, [variables.postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
      toast({ title: t("social.toasts.commentAdded") });
    },
    onError: (err: Error) => {
      const message = err?.message?.includes("404")
        ? t("social.toasts.postNotFound")
        : t("social.toasts.commentFailed");
      toast({ title: t("social.toasts.error"), description: message, variant: "destructive" });
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (bookmarkedSet.has(postId)) {
        await apiRequest("DELETE", `/api/bookmarks/${postId}`);
        return { postId, saved: false };
      }
      await apiRequest("POST", `/api/bookmarks/${postId}`);
      return { postId, saved: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] }),
    onError: () => toast({ title: t("social.toasts.bookmarkFailed"), variant: "destructive" }),
  });

  const handleSubmitComment = (postId: string) => {
    const content = (commentInputs[postId] ?? "").trim();
    if (!content) {
      toast({ title: t("social.toasts.commentEmpty"), variant: "destructive" });
      return;
    }
    commentMutation.mutate({ postId, content });
  };

  const handleCreatePost = () => {
    if (contentFormat === "public") return;
    const format = apiFormat as PostFormat;
    const { tagInput, images, ...postData } = newPost;
    void tagInput;

    if (format === "story") {
      if (!images.length) {
        toast({ title: t("social.toasts.storyMediaRequired"), variant: "destructive" });
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
        toast({ title: t("social.toasts.reelVideoRequired"), variant: "destructive" });
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
        toast({ title: t("social.toasts.journalTitleRequired"), variant: "destructive" });
        return;
      }
      if (newPost.content.trim().length < 80) {
        toast({ title: t("social.toasts.journalMinLength"), variant: "destructive" });
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
      toast({ title: t("social.toasts.postFieldsRequired"), variant: "destructive" });
      return;
    }
    createPostMutation.mutate({
      format: "post",
      ...postData,
      images: images.length > 0 ? images : undefined,
    });
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploadingMedia(true);
    try {
      const urls: string[] = [];
      for (const file of files) urls.push(await uploadMediaFile(file));
      setNewPost((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      toast({
        title: t("social.toasts.uploadFailed"),
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

  const composerPlaceholder =
    contentFormat === "stories"
      ? t("social.composer.story")
      : contentFormat === "reels"
        ? t("social.composer.reel")
        : contentFormat === "journals"
          ? t("social.composer.journal")
          : t("social.composer.feed");

  const feedModeTabs = useMemo(
    () => filters.feedModeTabs.map(({ value, label }) => ({ id: value as FeedMode, label })),
    [filters.feedModeTabs],
  );

  const showFeedModeTabs =
    contentFormat === "feed" || contentFormat === "journals" || contentFormat === "public";

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("social.auth.title")}</h1>
          <p className="text-muted-foreground">{t("social.auth.description")}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <PageShell
          title={t("nav.communityHub")}
          description={t("social.subtitle")}
          titleVariant="immersive"
          breadcrumbs={[
            { label: t("nav.communityHub"), href: "/social-feed" },
            ...(contentFormat !== "feed" ? [{ label: t(`social.formats.${contentFormat}`) }] : []),
          ]}
        >
          <div className="my-4 space-y-4">
            <CreatorSpotlight />
            <AitLeaderboard compact />
          </div>

          <SocialFormatTabs value={contentFormat} onChange={setContentFormat} />

          {showFeedModeTabs && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <ChatFilterTabs
                tabs={feedModeTabs}
                value={feedMode}
                onChange={(id) => {
                  setFeedMode(id);
                  setActiveTag(null);
                }}
                layoutId="social-feed-mode-glider"
              />
              {activeTag && (
                <Badge
                  variant="default"
                  className="cursor-pointer rounded-full"
                  onClick={() => setActiveTag(null)}
                >
                  #{activeTag} ×
                </Badge>
              )}
            </div>
          )}

          {contentFormat !== "public" && (
            <SocialComposer
              contentFormat={contentFormat}
              user={user}
              isCreating={isCreating}
              onCreatingChange={setIsCreating}
              draft={newPost}
              onDraftChange={setNewPost}
              onPublish={handleCreatePost}
              publishing={createPostMutation.isPending}
              uploadingMedia={uploadingMedia}
              onMediaSelect={handleMediaSelect}
              onAddTag={handleAddTag}
              placeholder={composerPlaceholder}
            />
          )}

          {storyView && (
            <StoryViewer
              posts={storyView.posts}
              index={storyView.index}
              onClose={() => setStoryView(null)}
              onIndexChange={(index) => setStoryView((s) => (s ? { ...s, index } : null))}
            />
          )}

          <div className="space-y-6">
            <SocialFeedList
              contentFormat={contentFormat}
              posts={displayedPosts}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRefetch={refetch}
              onCreateClick={() => setIsCreating(true)}
              formatDate={(date) => format(new Date(date), "d MMM yyyy, HH:mm", { locale: ru })}
              activeTag={activeTag}
              onTagClick={(tag) => setActiveTag(activeTag === tag ? null : tag)}
              onOpenStoryGroup={(group, startIndex) =>
                setStoryView({ posts: group.posts, index: startIndex })
              }
              user={user}
              bookmarkedSet={bookmarkedSet}
              expandedComments={expandedComments}
              commentInputs={commentInputs}
              onToggleComments={(postId) =>
                setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
              }
              onCommentChange={(postId, value) =>
                setCommentInputs((prev) => ({ ...prev, [postId]: value }))
              }
              onSubmitComment={handleSubmitComment}
              commentPending={commentMutation.isPending}
              onLike={(postId, isLiked) => likePostMutation.mutate({ postId, isLiked })}
              likePending={likePostMutation.isPending}
              onBookmark={(postId) => toggleBookmarkMutation.mutate(postId)}
            />
          </div>
        </PageShell>
      </div>
    </AppLayout>
  );
}

export default SocialFeed;
