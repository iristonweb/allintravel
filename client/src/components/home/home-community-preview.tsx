import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import GlassCard from "@/components/brand/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import HomeSectionHeader from "@/components/home/home-section-header";
import { Bookmark, Heart, MapPin, MessageCircle, Share2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUNITY_TRAVEL_SRC } from "@/lib/marketing-images";
import { type FeedMode, feedModeToQuery, filterPostsForFeedMode } from "@/lib/feed-utils";
import { getDemoPostsForMode, type DemoCommunityPost } from "@/lib/demo-community-posts";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { TravelPostWithAuthor } from "@shared/schema";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import { Trans, useTranslation } from "react-i18next";

const FEED_MODES: FeedMode[] = ["all", "following", "popular"];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function PostCard({
  post,
  onAction,
  bookmarkLabel,
}: {
  post: DemoCommunityPost;
  onAction: (e: React.MouseEvent) => void;
  bookmarkLabel: string;
}) {
  return (
    <GlassCard strong className="overflow-hidden min-w-[280px] max-w-sm flex-1 snap-start">
      <div className="p-5 flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-ait-purple/40">
          <AvatarImage src={resolveMediaUrl(post.authorAvatar) ?? post.authorAvatar} />
          <AvatarFallback>{post.authorName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold text-lg">{post.authorName}</h4>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-ait-orange" />
            {post.location}
          </div>
        </div>
      </div>
      <div
        className="h-56 md:h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url('${post.imageUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/90 via-transparent to-transparent" />
        <p className="absolute bottom-4 left-4 right-4 text-slate-200 text-sm leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </div>
      <div className="p-4 flex items-center justify-between border-t border-white/8">
        <div className="flex gap-2" onClick={onAction} onKeyDown={() => {}} role="presentation">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={onAction}
          >
            <Heart className="h-4 w-4 mr-1 fill-current" />
            {formatCount(post.likesCount)}
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400" onClick={onAction}>
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.commentsCount}
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400" onClick={onAction}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-ait-purple"
          onClick={onAction}
          aria-label={bookmarkLabel}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>
    </GlassCard>
  );
}

function apiPostToDemo(post: TravelPostWithAuthor, t: (key: string) => string): DemoCommunityPost {
  return {
    id: post.id,
    authorName: post.author?.firstName
      ? `${post.author.firstName} ${post.author.lastName ?? ""}`.trim()
      : t("home.communityPreview.traveler"),
    authorAvatar: post.author?.profileImageUrl ?? "https://i.pravatar.cc/120?img=1",
    location: post.location ?? t("home.communityPreview.onTheRoad"),
    imageUrl: post.images?.[0] ?? COMMUNITY_TRAVEL_SRC,
    excerpt: post.content?.slice(0, 160) ?? post.title ?? "",
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
  };
}

type HomeCommunityPreviewProps = {
  useLiveData?: boolean;
};

function buildFeedHref(mode: FeedMode, isAuthenticated: boolean): string {
  const path = `/social-feed${feedModeToQuery(mode)}`;
  if (isAuthenticated) return path;
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export default function HomeCommunityPreview({ useLiveData = false }: HomeCommunityPreviewProps) {
  const { t, i18n } = useTranslation();
  const filters = useFilterLabels();
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const feedModeLabels = useMemo(() => {
    const map = new Map(filters.feedModeTabs.map((tab) => [tab.value, tab.label]));
    return (mode: FeedMode) => map.get(mode) ?? mode;
  }, [filters.feedModeTabs]);

  const { data: apiPosts = [] } = useQuery<TravelPostWithAuthor[]>({
    queryKey: feedMode === "following" ? ["/api/posts", { following: user?.id }] : ["/api/posts"],
    enabled: useLiveData && isAuthenticated && (feedMode !== "following" || !!user?.id),
  });

  const liveFiltered = filterPostsForFeedMode(apiPosts, feedMode);
  const demoPosts = getDemoPostsForMode(feedMode, i18n.language);
  const showLive = useLiveData && isAuthenticated && liveFiltered.length > 0;
  const posts: DemoCommunityPost[] = showLive
    ? liveFiltered.slice(0, 3).map((post) => apiPostToDemo(post, t))
    : demoPosts;

  const feedHref = buildFeedHref(feedMode, isAuthenticated);

  const handlePostAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: t("home.communityPreview.signInTitle"),
        description: t("home.communityPreview.signInHint", { mode: feedModeLabels(feedMode) }),
      });
      navigate(feedHref);
      return;
    }
    navigate(feedHref);
  };

  return (
    <motion.section
      id="community"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="space-y-6 scroll-mt-28"
    >
      <HomeSectionHeader
        title={t("home.communityPreview.title")}
        description={t("home.communityPreview.description")}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 ait-nav-pill rounded-full p-1">
              {FEED_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFeedMode(mode)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
                    feedMode === mode
                      ? "ait-nav-active text-white"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  {feedModeLabels(mode)}
                </button>
              ))}
            </div>
            <Link href={feedHref}>
              <Button variant="glass" size="sm">
                {t("home.communityPreview.openFeed")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      {!isAuthenticated && feedMode === "following" && (
        <p className="text-sm text-muted-foreground text-center ait-glass rounded-2xl px-4 py-3">
          <Trans
            i18nKey="home.communityPreview.followingHint"
            components={{
              signIn: <Link href={feedHref} className="text-ait-purple hover:underline" />,
            }}
          />
        </p>
      )}

      {!isAuthenticated && feedMode === "popular" && (
        <p className="text-sm text-muted-foreground text-center">
          {t("home.communityPreview.popularHint")}
        </p>
      )}

      {!showLive && useLiveData && isAuthenticated && (
        <p className="text-sm text-muted-foreground text-center">
          <Trans
            i18nKey="home.communityPreview.emptyLiveHint"
            components={{
              link: <Link href={feedHref} className="text-ait-purple hover:underline" />,
            }}
          />
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={feedMode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <Link href={feedHref}>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible cursor-pointer">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onAction={handlePostAction}
                  bookmarkLabel={t("home.communityPreview.bookmark")}
                />
              ))}
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}
