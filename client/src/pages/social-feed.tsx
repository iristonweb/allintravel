import { useState, useMemo, useEffect } from "react";
import { type FeedMode, sortPostsByFeedSort } from "@/lib/feed-utils";
import AppLayout from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type { TravelPostWithAuthor } from "@shared/schema";
import { uploadMediaFile, isVideoFile, SERVER_UPLOAD_MAX_BYTES } from "@/lib/upload-media";
import { formatApiErrorDescription, isApiError } from "@/lib/api-error";
import type { PostFormat } from "@shared/post-formats";
import StoryViewer from "@/components/feed/StoryViewer";
import SocialFormatTabs from "@/components/social/SocialFormatTabs";
import FeedSortTabs from "@/components/social/FeedSortTabs";
import SocialComposer, { type SocialNewPostDraft } from "@/components/social/SocialComposer";
import SocialFeedList from "@/components/social/SocialFeedList";
import { type SocialContentFormat } from "@/hooks/useSocialFeedParams";
import { useTranslation } from "react-i18next";
import { isVideoUrl as isVideoUrlShared } from "@shared/post-formats";
import CommunityRightRail from "@/components/community/CommunityRightRail";
import ReelsRightRail from "@/components/community/ReelsRightRail";
import CommunityStatsRow from "@/components/community/CommunityStatsRow";
import MobileRightRailSheet from "@/components/layout/mobile-right-rail-sheet";
import StoriesStrip, { StoriesStripCreateLink } from "@/components/feed/StoriesStrip";
import StoriesStripSkeleton from "@/components/feed/StoriesStripSkeleton";
import CommunityWidgetsSkeleton from "@/components/community/CommunityWidgetsSkeleton";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import {
  groupStories,
  mapStoryGroupsToStripItems,
  storyGroupsByUserId,
} from "@/lib/stories-strip-mapper";
import {
  getDemoStoryStripItems,
  getDemoStoryPosts,
  isSocialFeedDemoMode,
  isDemoPostId,
} from "@/lib/demo-reels-feed";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitFilterPills from "@/components/ait-ui/AitFilterPills";
import AiContextChips from "@/components/ai/AiContextChips";
import { Plus, Sparkles } from "lucide-react";
import { Link } from "wouter";
import {
  buildPostsQueryParams,
  useBookmarks,
  useReelsCount,
  useSocialFeedMutations,
  useSocialFeedPosts,
  useStoryPosts,
} from "@/hooks/useSocialFeedData";
import { useSocialFeedTabs } from "@/hooks/useSocialFeedTabs";

const EMPTY_DRAFT: SocialNewPostDraft = {
  title: "",
  content: "",
  location: "",
  latitude: null,
  longitude: null,
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

const FORMAT_HEADER_KEYS: Record<
  SocialContentFormat,
  { titleKey: string; descriptionKey: string; titleDefault?: string; descriptionDefault?: string }
> = {
  feed: {
    titleKey: "social.communityTitle",
    descriptionKey: "social.communityTagline",
    titleDefault: "Travelers community",
    descriptionDefault: "GET INSPIRED • SHARE • PLAN",
  },
  stories: {
    titleKey: "social.formats.stories",
    descriptionKey: "social.headers.stories.subtitle",
    descriptionDefault: "24-hour stories from travelers",
  },
  reels: {
    titleKey: "social.formats.reels",
    descriptionKey: "social.headers.reels.subtitle",
    descriptionDefault: "Vertical travel videos from the community",
  },
  journals: {
    titleKey: "social.formats.journals",
    descriptionKey: "social.headers.journals.subtitle",
    descriptionDefault: "Long-form travel journals",
  },
  public: {
    titleKey: "social.formats.public",
    descriptionKey: "social.headers.public.subtitle",
    descriptionDefault: "Public articles and guides",
  },
};

export function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
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

  const {
    feedMode,
    setFeedMode,
    contentFormat,
    setContentFormat,
    isCreating,
    setIsCreating,
    reelsFilterPills,
    showComposer,
    createHref,
    feedSort,
    setFeedSort,
  } = useSocialFeedTabs({
    isAuthenticated,
    onFormatChange: () => {
      setActiveTag(null);
      setExpandedComments({});
    },
    onFeedModeChange: () => {
      setActiveTag(null);
      setExpandedComments({});
    },
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => undefined,
      { maximumAge: 300_000, timeout: 8000 },
    );
  }, []);

  const apiFormat = contentFormatToApi(contentFormat);
  const postsQueryParams = useMemo(
    () =>
      buildPostsQueryParams({
        contentFormat,
        apiFormat,
        feedMode,
        activeTag,
        userId: user?.id,
      }),
    [apiFormat, activeTag, feedMode, user?.id, contentFormat],
  );

  const postsEnabled =
    isAuthenticated && (contentFormat === "public" || feedMode !== "following" || !!user?.id);

  const { displayedPosts, isLoading, isError, error, refetch } = useSocialFeedPosts({
    enabled: postsEnabled,
    postsQueryParams,
    contentFormat,
    feedMode,
    userLat: userCoords?.lat,
    userLon: userCoords?.lon,
  });

  const { data: storyPosts = [], isLoading: storiesLoading } = useStoryPosts(isAuthenticated);
  const { reelsCount, displayReelsCount } = useReelsCount(isAuthenticated);
  const { bookmarkedSet } = useBookmarks(isAuthenticated);
  const { createPostMutation, likePostMutation, commentMutation, toggleBookmarkMutation } =
    useSocialFeedMutations(bookmarkedSet);

  const handleSubmitComment = (postId: string) => {
    if (demoMode || isDemoPostId(postId)) return;
    const content = (commentInputs[postId] ?? "").trim();
    if (!content) {
      toast({ title: t("social.toasts.commentEmpty"), variant: "destructive" });
      return;
    }
    commentMutation.mutate(
      { postId, content },
      {
        onSuccess: () => {
          setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
          toast({ title: t("social.toasts.commentAdded") });
        },
        onError: (err: Error) => {
          const message = err?.message?.includes("404")
            ? t("social.toasts.postNotFound")
            : t("social.toasts.commentFailed");
          toast({ title: t("social.toasts.error"), description: message, variant: "destructive" });
        },
      },
    );
  };

  const handleCreatePost = () => {
    if (contentFormat === "public") return;
    const format = apiFormat as PostFormat;
    const { tagInput, images, ...postData } = newPost;
    void tagInput;

    const onSuccess = () => {
      toast({ title: t("social.toasts.published") });
      setIsCreating(false);
      setNewPost(EMPTY_DRAFT);
    };
    const onError = (err: Error) => {
      if (isApiError(err)) {
        if (err.status === 401 || err.message === "Unauthorized") {
          toast({
            title: t("social.toasts.signInRequired"),
            variant: "destructive",
          });
          return;
        }
        const description =
          err.status === 400 && err.errors?.length
            ? formatApiErrorDescription(err)
            : err.status >= 500
              ? err.message || t("social.toasts.serverError")
              : err.message || t("social.toasts.publishFailed");
        toast({
          title: t("social.toasts.publishErrorTitle"),
          description,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("social.toasts.publishErrorTitle"),
        description: err.message || t("social.toasts.publishFailed"),
        variant: "destructive",
      });
    };

    if (format === "story") {
      if (!images.length) {
        toast({ title: t("social.toasts.storyMediaRequired"), variant: "destructive" });
        return;
      }
      createPostMutation.mutate(
        { format, ...postData, title: "", content: postData.content.trim() || " ", images },
        { onSuccess, onError },
      );
      return;
    }

    if (format === "reel") {
      if (!images.some(isVideoUrlShared)) {
        toast({ title: t("social.toasts.reelVideoRequired"), variant: "destructive" });
        return;
      }
      createPostMutation.mutate(
        { format, ...postData, title: "", content: postData.content.trim() || " ", images },
        { onSuccess, onError },
      );
      return;
    }

    if (format === "journal") {
      if (!newPost.title.trim() || newPost.title.trim().length < 2) {
        toast({ title: t("social.toasts.journalTitleRequired"), variant: "destructive" });
        return;
      }
      if (newPost.content.trim().length < 80) {
        toast({ title: t("social.toasts.journalMinLength"), variant: "destructive" });
        return;
      }
      createPostMutation.mutate(
        { format, ...postData, isPublic: true, images: images.length > 0 ? images : undefined },
        { onSuccess, onError },
      );
      return;
    }

    if (!newPost.title.trim() || newPost.title.trim().length < 2 || !newPost.content.trim()) {
      toast({ title: t("social.toasts.postFieldsRequired"), variant: "destructive" });
      return;
    }
    createPostMutation.mutate(
      { format: "post", ...postData, images: images.length > 0 ? images : undefined },
      { onSuccess, onError },
    );
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (contentFormat === "reels" && !isVideoFile(file)) {
        toast({ title: t("social.toasts.reelVideoRequired"), variant: "destructive" });
        continue;
      }
      if (import.meta.env.PROD && file.size > SERVER_UPLOAD_MAX_BYTES) {
        toast({
          title: t("social.toasts.largeUploadTitle"),
          description: t("social.toasts.largeUploadHint"),
        });
      }
      validFiles.push(file);
    }
    if (!validFiles.length) return;

    setUploadingMedia(true);
    try {
      const urls: string[] = [];
      for (const file of validFiles) {
        urls.push(await uploadMediaFile(file));
      }
      setNewPost((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      const description = isApiError(err)
        ? formatApiErrorDescription(err)
        : err instanceof Error
          ? err.message
          : undefined;
      toast({
        title: t("social.toasts.uploadFailed"),
        description,
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

  const demoMode = isSocialFeedDemoMode();
  const headerMeta = FORMAT_HEADER_KEYS[contentFormat];

  const feedSortTabs = useMemo(
    () => [
      { id: "popular" as const, label: t("social.feedSort.popular", { defaultValue: "Popular" }) },
      { id: "new" as const, label: t("social.feedSort.new", { defaultValue: "New" }) },
      {
        id: "discussed" as const,
        label: t("social.feedSort.discussed", { defaultValue: "Discussed" }),
      },
    ],
    [t],
  );

  const isHubView = contentFormat === "feed";
  const showStoriesStrip = isHubView || contentFormat === "stories";
  const showFilterPills =
    contentFormat === "feed" || contentFormat === "reels" || contentFormat === "journals";

  const feedPosts = useMemo(() => {
    if (contentFormat !== "feed") return displayedPosts;
    return sortPostsByFeedSort(displayedPosts, feedSort);
  }, [contentFormat, displayedPosts, feedSort]);
  const rightRailLoading = isLoading && !demoMode && contentFormat === "reels";
  const rightRail = rightRailLoading ? (
    <CommunityWidgetsSkeleton />
  ) : contentFormat === "reels" ? (
    <ReelsRightRail posts={displayedPosts} />
  ) : (
    <CommunityRightRail posts={displayedPosts} />
  );

  const storyGroups = useMemo(() => groupStories(storyPosts), [storyPosts]);
  const storyStripItems = useMemo(() => {
    if (demoMode) return getDemoStoryStripItems();
    return mapStoryGroupsToStripItems(storyGroups);
  }, [storyGroups, demoMode]);
  const storyGroupsById = useMemo(() => storyGroupsByUserId(storyGroups), [storyGroups]);
  const userStoryFallback =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim() || "?";

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
    <AppLayout rightRail={rightRail} columnMaxWidth="feed">
      <ReelsPageLayout
        header={
          <AitSectionHeader
            title={t(headerMeta.titleKey, { defaultValue: headerMeta.titleDefault })}
            description={t(headerMeta.descriptionKey, {
              defaultValue: headerMeta.descriptionDefault,
            })}
            actions={
              <>
                <AitButton variant="primary" className="gap-2" asChild>
                  <Link href={createHref}>
                    <Plus className="h-4 w-4" />
                    {t("social.create")}
                  </Link>
                </AitButton>
                <AitButton variant="glass" className="gap-2 hidden sm:inline-flex" asChild>
                  <Link href="/trips">
                    <Sparkles className="h-4 w-4 text-ait-purple" />
                    {t("nav.aiScout", { defaultValue: "AI Scout" })}
                  </Link>
                </AitButton>
              </>
            }
          />
        }
        stats={
          isHubView ? (
            <div className="space-y-3">
              <CommunityStatsRow
                reelsCount={reelsCount}
                displayReelsCount={displayReelsCount}
                useMarketingStats={demoMode}
              />
              <AiContextChips surface="social" />
            </div>
          ) : undefined
        }
        stories={
          showStoriesStrip ? (
            <>
              <MobileRightRailSheet title={t("social.widgets", { defaultValue: "Discover" })}>
                {rightRail}
              </MobileRightRailSheet>
              {storiesLoading && !demoMode ? (
                <StoriesStripSkeleton />
              ) : (
                <StoriesStrip
                  createLabel={t("social.stories.yourStory", { defaultValue: "Your story" })}
                  yourStoryAvatar={{ src: user?.profileImageUrl, fallback: userStoryFallback }}
                  items={storyStripItems}
                  createAction={
                    <StoriesStripCreateLink
                      href="/social-feed?format=stories&create=1"
                      label={t("social.stories.yourStory", { defaultValue: "Your story" })}
                      avatar={{ src: user?.profileImageUrl, fallback: userStoryFallback }}
                    />
                  }
                  onItemClick={(item) => {
                    const group = storyGroupsById.get(item.id);
                    if (group) {
                      setStoryView({ posts: group.posts, index: 0 });
                      return;
                    }
                    if (demoMode) {
                      const demoPosts = getDemoStoryPosts().filter((p) => p.userId === item.id);
                      if (demoPosts.length) setStoryView({ posts: demoPosts, index: 0 });
                    }
                  }}
                />
              )}
            </>
          ) : (
            <MobileRightRailSheet title={t("social.widgets", { defaultValue: "Discover" })}>
              {rightRail}
            </MobileRightRailSheet>
          )
        }
        tabs={
          <div className="sticky top-[calc(var(--ait-header-h,4.5rem)+0.25rem)] z-20 -mx-1 rounded-2xl border border-white/5 bg-ait-deep/80 px-1 py-1 backdrop-blur-md supports-[backdrop-filter]:bg-ait-deep/70">
            <SocialFormatTabs
              value={contentFormat}
              onChange={setContentFormat}
              className="mb-0 mt-0 overflow-x-auto scrollbar-hide"
            />
          </div>
        }
        toolbar={
          isHubView ? (
            <FeedSortTabs items={feedSortTabs} value={feedSort} onChange={setFeedSort} />
          ) : undefined
        }
        filters={
          showFilterPills ? (
            <div className="flex flex-wrap items-center gap-2">
              <AitFilterPills
                items={reelsFilterPills}
                value={feedMode}
                onChange={(id) => setFeedMode(id as FeedMode)}
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
          ) : undefined
        }
        composer={
          showComposer ? (
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
          ) : undefined
        }
        feed={
          <>
            {demoMode && (
              <div className="mb-4 rounded-xl border border-ait-purple/30 bg-ait-purple/10 px-4 py-3 text-sm text-center">
                <span className="font-medium text-ait-purple">{t("social.demo.bannerLabel")}</span>
                <span className="text-muted-foreground"> {t("social.demo.bannerHint")}</span>
              </div>
            )}
            {storyView && (
              <StoryViewer
                posts={storyView.posts}
                index={storyView.index}
                onClose={() => setStoryView(null)}
                onIndexChange={(index) => setStoryView((s) => (s ? { ...s, index } : null))}
                actionsDisabled={demoMode}
              />
            )}
            <div className={contentFormat === "reels" ? "" : "space-y-8"}>
              <SocialFeedList
                contentFormat={contentFormat}
                feedMode={feedMode}
                posts={feedPosts}
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRefetch={refetch}
                onCreateClick={() => setIsCreating(true)}
                formatDate={(date) =>
                  format(new Date(date), "d MMM yyyy, HH:mm", { locale: dateLocale })
                }
                activeTag={activeTag}
                onTagClick={(tag) => setActiveTag(activeTag === tag ? null : tag)}
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
                onLike={(postId, isLiked) => {
                  if (demoMode || isDemoPostId(postId)) return;
                  likePostMutation.mutate({ postId, isLiked });
                }}
                likePendingPostId={
                  likePostMutation.isPending ? likePostMutation.variables?.postId : undefined
                }
                actionsDisabled={demoMode}
                onBookmark={(postId) => {
                  if (demoMode || isDemoPostId(postId)) return;
                  toggleBookmarkMutation.mutate(postId, {
                    onError: () =>
                      toast({ title: t("social.toasts.bookmarkFailed"), variant: "destructive" }),
                  });
                }}
              />
            </div>
          </>
        }
      />
    </AppLayout>
  );
}

export default SocialFeed;
