import { useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Film } from "lucide-react";
import type { FeedMode } from "@/lib/feed-utils";
import EmptyState from "@/components/empty-state";
import FeedSkeleton from "@/components/social/FeedSkeleton";
import AitButton from "@/components/ait-ui/AitButton";
import AitAvatarRing from "@/components/ait-ui/AitAvatarRing";
import ReelCard from "@/components/feed/ReelCard";
import { ReelsSnapFeed, ReelsSnapItem } from "@/components/feed/ReelsPageLayout";
import { useReelSnapObserver, useReelsMutePreference } from "@/hooks/useReelPlayer";
import { authorLinkForPost, mapPostToReelCard } from "@/lib/reel-card-mapper";
import { shareUrl } from "@/lib/share";
import type { TravelPostWithAuthor } from "@shared/schema";

type ReelsVerticalFeedProps = {
  posts: TravelPostWithAuthor[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  feedMode: FeedMode;
  onRefetch: () => void;
  onCreateClick: () => void;
  bookmarkedSet: Set<string>;
  expandedComments: Record<string, boolean>;
  commentInputs: Record<string, string>;
  onToggleComments: (postId: string) => void;
  onCommentChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
  commentPending: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  likePendingPostId?: string;
  actionsDisabled?: boolean;
  onBookmark: (postId: string) => void;
};

export default function ReelsVerticalFeed({
  posts,
  isLoading,
  isError,
  error,
  feedMode,
  onRefetch,
  onCreateClick,
  bookmarkedSet,
  expandedComments,
  commentInputs,
  onToggleComments,
  onCommentChange,
  onSubmitComment,
  commentPending,
  onLike,
  likePendingPostId,
  actionsDisabled = false,
  onBookmark,
}: ReelsVerticalFeedProps) {
  const { t } = useTranslation();
  const { muted, toggleMute } = useReelsMutePreference();
  const resetKey = `${feedMode}-${posts.map((p) => p.id).join(",")}`;
  const { containerRef, activeIndex, setItemRef } = useReelSnapObserver({
    itemCount: posts.length,
    resetKey,
  });

  const labels = useMemo(
    () => ({
      doubleTapLike: t("social.reels.doubleTapLike", { defaultValue: "Double tap to like" }),
      videoUnavailable: t("social.reels.videoUnavailable", { defaultValue: "Video unavailable" }),
      like: t("social.feed.like"),
      comments: t("social.feed.comments"),
      share: t("social.reels.share", { defaultValue: "Share" }),
      save: t("social.reels.save", { defaultValue: "Save" }),
      mute: t("social.reels.mute", { defaultValue: "Mute" }),
      unmute: t("social.reels.unmute", { defaultValue: "Unmute" }),
      pause: t("social.reels.pause", { defaultValue: "Pause" }),
      play: t("social.reels.play", { defaultValue: "Play" }),
      commentPlaceholder: t("social.feed.commentPlaceholder"),
      publish: t("social.composer.publish"),
    }),
    [t],
  );

  if (isLoading) {
    return <FeedSkeleton count={1} />;
  }

  if (isError) {
    return (
      <EmptyState
        title={t("social.errors.loadFeed")}
        description={error instanceof Error ? error.message : t("social.errors.connection")}
        action={
          <AitButton variant="secondary" onClick={onRefetch}>
            {t("common.retry")}
          </AitButton>
        }
      />
    );
  }

  if (!posts.length) {
    return (
      <EmptyState
        variant="glass"
        icon={Film}
        title={t("social.reels.empty", { defaultValue: "No Reels yet" })}
        description={t("social.reels.emptyHint", {
          defaultValue: "Upload a vertical video to get started",
        })}
        action={
          <AitButton variant="primary" onClick={onCreateClick}>
            {t("social.create")}
          </AitButton>
        }
      />
    );
  }

  return (
    <ReelsSnapFeed containerRef={containerRef}>
      {posts.map((post, index) => {
        const shouldRender = Math.abs(index - activeIndex) <= 1;
        const profileHref = authorLinkForPost(post);
        const authorAction = (
          <Link href={profileHref}>
            <AitAvatarRing
              src={post.author?.profileImageUrl}
              fallback={post.author?.firstName?.[0] || "?"}
              size="sm"
              active={false}
            />
          </Link>
        );

        return (
          <ReelsSnapItem key={post.id} ref={(el) => setItemRef(index, el)} data-reel-index={index}>
            {shouldRender ? (
              <ReelCard
                reel={mapPostToReelCard(post, {
                  travelerLabel: t("social.traveler"),
                  authorAction,
                })}
                isActive={index === activeIndex}
                muted={muted}
                bookmarked={bookmarkedSet.has(post.id)}
                likePending={likePendingPostId === post.id}
                commentPending={commentPending}
                actionsDisabled={actionsDisabled}
                commentsOpen={Boolean(expandedComments[post.id])}
                commentText={commentInputs[post.id] || ""}
                labels={labels}
                onLike={() => {
                  if (!actionsDisabled) onLike(post.id, post.isLiked ?? false);
                }}
                onDoubleTapLike={() => {
                  if (!actionsDisabled && !post.isLiked) onLike(post.id, false);
                }}
                onToggleMute={toggleMute}
                onCommentToggle={() => onToggleComments(post.id)}
                onCommentChange={(value) => onCommentChange(post.id, value)}
                onSubmitComment={() => onSubmitComment(post.id)}
                onShare={() => {
                  const shareLink = `${window.location.origin}/post/${post.id}`;
                  const authorName = post.author
                    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim()
                    : "";
                  void shareUrl(shareLink, post.title || authorName, post.content?.slice(0, 120));
                }}
                onBookmark={() => {
                  if (!actionsDisabled) onBookmark(post.id);
                }}
              />
            ) : (
              <div className="h-full w-full bg-ait-deep rounded-card-xl" />
            )}
          </ReelsSnapItem>
        );
      })}
    </ReelsSnapFeed>
  );
}
