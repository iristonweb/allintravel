import { useTranslation } from "react-i18next";
import { BookMarked, Compass, AlertCircle } from "lucide-react";
import FeedSkeleton from "@/components/social/FeedSkeleton";
import EmptyState from "@/components/empty-state";
import AitButton from "@/components/ait-ui/AitButton";
import ReelsVerticalFeed from "@/components/feed/ReelsVerticalFeed";
import JournalCard from "@/components/feed/JournalCard";
import FeedPostCard from "@/components/social/FeedPostCard";
import type { FeedMode } from "@/lib/feed-utils";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";
import type { TravelPostWithAuthor, User } from "@shared/schema";

type SocialFeedListProps = {
  contentFormat: SocialContentFormat;
  feedMode: FeedMode;
  posts: TravelPostWithAuthor[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRefetch: () => void;
  onCreateClick: () => void;
  formatDate: (date: string | Date) => string;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
  user?: User | null;
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

export default function SocialFeedList({
  contentFormat,
  feedMode,
  posts,
  isLoading,
  isError,
  error,
  onRefetch,
  onCreateClick,
  formatDate,
  activeTag,
  onTagClick,
  user,
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
}: SocialFeedListProps) {
  const { t } = useTranslation();

  if (isLoading && contentFormat !== "reels") {
    return <FeedSkeleton count={contentFormat === "feed" ? 2 : 1} />;
  }

  if (isError && contentFormat !== "reels") {
    return (
      <EmptyState
        icon={AlertCircle}
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

  if (contentFormat === "stories") {
    if (!posts.length) {
      return (
        <EmptyState
          variant="glass"
          icon={BookMarked}
          title={t("social.stories.empty", { defaultValue: "No stories yet" })}
          description={t("social.stories.emptyHint", {
            defaultValue: "Share a moment from your trip — stories disappear after 24 hours",
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
      <div className="space-y-6 py-2">
        <div className="rounded-2xl border border-ait-purple/20 bg-ait-purple/5 px-4 py-6 text-center space-y-2">
          <p className="text-base font-semibold text-foreground">
            {t("social.stories.tabHint", { defaultValue: "Tap a story above to watch" })}
          </p>
          <p className="text-sm text-muted-foreground">{t("social.storiesHint")}</p>
          <p className="text-xs text-muted-foreground/80">
            {t("social.stories.activeCount", {
              defaultValue: "{{count}} active stories",
              count: posts.length,
            })}
          </p>
          <AitButton variant="primary" className="mt-2" onClick={onCreateClick}>
            {t("social.create")}
          </AitButton>
        </div>
      </div>
    );
  }

  if (contentFormat === "reels") {
    return (
      <ReelsVerticalFeed
        posts={posts}
        feedMode={feedMode}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRefetch={onRefetch}
        onCreateClick={onCreateClick}
        bookmarkedSet={bookmarkedSet}
        expandedComments={expandedComments}
        commentInputs={commentInputs}
        onToggleComments={onToggleComments}
        onCommentChange={onCommentChange}
        onSubmitComment={onSubmitComment}
        commentPending={commentPending}
        onLike={onLike}
        likePendingPostId={likePendingPostId}
        actionsDisabled={actionsDisabled}
        onBookmark={onBookmark}
      />
    );
  }

  const renderJournal = (post: TravelPostWithAuthor) => (
    <JournalCard
      key={post.id}
      post={post}
      formatDate={formatDate}
      onTagClick={(tag) => onTagClick(tag)}
      user={user}
      bookmarked={bookmarkedSet.has(post.id)}
      expanded={Boolean(expandedComments[post.id])}
      commentText={commentInputs[post.id] || ""}
      likePending={likePendingPostId === post.id}
      commentPending={commentPending}
      actionsDisabled={actionsDisabled}
      onLike={() => onLike(post.id, post.isLiked ?? false)}
      onToggleComments={() => onToggleComments(post.id)}
      onCommentChange={(value) => onCommentChange(post.id, value)}
      onSubmitComment={() => onSubmitComment(post.id)}
      onBookmark={() => onBookmark(post.id)}
    />
  );

  const renderPublicGuide = (post: TravelPostWithAuthor) => (
    <JournalCard
      key={post.id}
      post={post}
      formatDate={formatDate}
      onTagClick={(tag) => onTagClick(tag)}
    />
  );

  if (contentFormat === "public") {
    if (posts.length === 0) {
      return (
        <EmptyState
          variant="glass"
          title={t("social.publicEmpty")}
          description={t("social.publicEmptyHint")}
        />
      );
    }
    return (
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground text-center">{t("social.publicGuidesHint")}</p>
        {posts.map(renderPublicGuide)}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        variant="glass"
        icon={Compass}
        title={t("social.emptyTitle")}
        description={t("social.emptyHint")}
        action={
          <AitButton variant="primary" onClick={onCreateClick}>
            {t("social.create")}
          </AitButton>
        }
      />
    );
  }

  if (contentFormat === "journals") {
    return <div className="space-y-8">{posts.map(renderJournal)}</div>;
  }

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          user={user}
          bookmarked={bookmarkedSet.has(post.id)}
          expanded={Boolean(expandedComments[post.id])}
          commentText={commentInputs[post.id] || ""}
          formatDate={formatDate}
          likePending={likePendingPostId === post.id}
          commentPending={commentPending}
          isDemo={actionsDisabled}
          onToggleComments={() => onToggleComments(post.id)}
          onCommentChange={(value) => onCommentChange(post.id, value)}
          onSubmitComment={() => onSubmitComment(post.id)}
          onLike={() => onLike(post.id, post.isLiked ?? false)}
          onBookmark={() => onBookmark(post.id)}
          onTagClick={(tag) => onTagClick(activeTag === tag ? "" : tag)}
        />
      ))}
    </div>
  );
}
