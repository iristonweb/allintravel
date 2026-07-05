import { useState, useMemo, useEffect } from "react";
import { type FeedMode } from "@/lib/feed-utils";
import AppLayout from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import { useAuth } from "@/hooks/useAuth";
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
import { type SocialContentFormat } from "@/hooks/useSocialFeedParams";
import { useTranslation } from "react-i18next";
import { isVideoUrl as isVideoUrlShared } from "@shared/post-formats";
import CommunityRightRail from "@/components/community/CommunityRightRail";
import ReelsRightRail from "@/components/community/ReelsRightRail";
import CommunityStatsRow from "@/components/community/CommunityStatsRow";
import MobileRightRailSheet from "@/components/layout/mobile-right-rail-sheet";
import StoriesStrip, { StoriesStripCreateLink } from "@/components/feed/StoriesStrip";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import {
  groupStories,
  mapStoryGroupsToStripItems,
  storyGroupsByUserId,
} from "@/lib/stories-strip-mapper";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitFilterPills from "@/components/ait-ui/AitFilterPills";
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
  feed: { titleKey: "nav.communityHub", descriptionKey: "social.subtitle" },
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
  const { t } = useTranslation();
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
    feedModeTabs,
    showFeedModeTabs,
    showReelsFilterPills,
    showComposer,
    createHref,
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

  const { data: storyPosts = [] } = useStoryPosts(isAuthenticated);
  const { reelsCount } = useReelsCount(isAuthenticated);
  const { bookmarkedSet } = useBookmarks(isAuthenticated);
  const { createPostMutation, likePostMutation, commentMutation, toggleBookmarkMutation } =
    useSocialFeedMutations(bookmarkedSet);

  const handleSubmitComment = (postId: string) => {
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
      const msg = err?.message ?? "";
      const description = msg.includes("401")
        ? t("social.toasts.signInRequired")
        : msg.includes("5")
          ? t("social.toasts.serverError")
          : t("social.toasts.publishFailed");
      toast({ title: t("social.toasts.publishErrorTitle"), description, variant: "destructive" });
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
      if (!newPost.title.trim()) {
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

    if (!newPost.title.trim() || !newPost.content.trim()) {
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

  const headerMeta = FORMAT_HEADER_KEYS[contentFormat];
  const rightRail =
    contentFormat === "reels" ? (
      <ReelsRightRail posts={displayedPosts} />
    ) : (
      <CommunityRightRail posts={displayedPosts} />
    );

  const storyGroups = useMemo(() => groupStories(storyPosts), [storyPosts]);
  const storyStripItems = useMemo(() => mapStoryGroupsToStripItems(storyGroups), [storyGroups]);
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
        stats={<CommunityStatsRow reelsCount={reelsCount} />}
        stories={
          <>
            <MobileRightRailSheet title={t("social.widgets", { defaultValue: "Discover" })}>
              {rightRail}
            </MobileRightRailSheet>
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
                if (group) setStoryView({ posts: group.posts, index: 0 });
              }}
            />
          </>
        }
        tabs={
          <SocialFormatTabs
            value={contentFormat}
            onChange={setContentFormat}
            className="overflow-x-auto scrollbar-hide"
          />
        }
        filters={
          showReelsFilterPills ? (
            <AitFilterPills
              items={reelsFilterPills}
              value={feedMode}
              onChange={(id) => setFeedMode(id as FeedMode)}
              className="mb-4"
            />
          ) : undefined
        }
        toolbar={
          showFeedModeTabs ? (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <ChatFilterTabs
                tabs={feedModeTabs}
                value={feedMode}
                onChange={(id) => setFeedMode(id as FeedMode)}
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
            {storyView && (
              <StoryViewer
                posts={storyView.posts}
                index={storyView.index}
                onClose={() => setStoryView(null)}
                onIndexChange={(index) => setStoryView((s) => (s ? { ...s, index } : null))}
              />
            )}
            <div className={contentFormat === "reels" ? "" : "space-y-8"}>
              <SocialFeedList
                contentFormat={contentFormat}
                feedMode={feedMode}
                posts={displayedPosts}
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRefetch={refetch}
                onCreateClick={() => setIsCreating(true)}
                formatDate={(date) => format(new Date(date), "d MMM yyyy, HH:mm", { locale: ru })}
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
                onLike={(postId, isLiked) => likePostMutation.mutate({ postId, isLiked })}
                likePending={likePostMutation.isPending}
                onBookmark={(postId) =>
                  toggleBookmarkMutation.mutate(postId, {
                    onError: () =>
                      toast({ title: t("social.toasts.bookmarkFailed"), variant: "destructive" }),
                  })
                }
              />
            </div>
          </>
        }
      />
    </AppLayout>
  );
}

export default SocialFeed;
