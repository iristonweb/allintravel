import { useTranslation } from "react-i18next";
import { Compass, AlertCircle } from "lucide-react";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import StoryBar, { type StoryGroup } from "@/components/feed/StoryBar";
import StoryCreateButton from "@/components/social/StoryCreateButton";
import ReelFeed from "@/components/feed/ReelFeed";
import JournalCard from "@/components/feed/JournalCard";
import FeedPostCard from "@/components/social/FeedPostCard";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";
import type { TravelPostWithAuthor, User } from "@shared/schema";

type SocialFeedListProps = {
  contentFormat: SocialContentFormat;
  posts: TravelPostWithAuthor[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRefetch: () => void;
  onCreateClick: () => void;
  formatDate: (date: string | Date) => string;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
  onOpenStoryGroup: (group: StoryGroup, startIndex: number) => void;
  user?: User | null;
  bookmarkedSet: Set<string>;
  expandedComments: Record<string, boolean>;
  commentInputs: Record<string, string>;
  onToggleComments: (postId: string) => void;
  onCommentChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
  commentPending: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  likePending: boolean;
  onBookmark: (postId: string) => void;
};

export default function SocialFeedList({
  contentFormat,
  posts,
  isLoading,
  isError,
  error,
  onRefetch,
  onCreateClick,
  formatDate,
  activeTag,
  onTagClick,
  onOpenStoryGroup,
  user,
  bookmarkedSet,
  expandedComments,
  commentInputs,
  onToggleComments,
  onCommentChange,
  onSubmitComment,
  commentPending,
  onLike,
  likePending,
  onBookmark,
}: SocialFeedListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner mx-auto" />
        <p className="text-muted-foreground mt-2">{t("social.loadingPosts")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t("social.errors.loadFeed")}
        description={error instanceof Error ? error.message : t("social.errors.connection")}
        action={
          <Button variant="outline" onClick={onRefetch}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  if (contentFormat === "stories") {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 items-start">
          <StoryCreateButton />
          <div className="flex-1 min-w-0">
            <StoryBar posts={posts} onOpenGroup={onOpenStoryGroup} inline />
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">{t("social.storiesHint")}</p>
      </div>
    );
  }

  if (contentFormat === "reels") {
    return <ReelFeed posts={posts} />;
  }

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
      <>
        {posts.map((post) => (
          <JournalCard
            key={post.id}
            post={post}
            formatDate={formatDate}
            onTagClick={(tag) => onTagClick(tag)}
          />
        ))}
      </>
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
          <Button variant="premium" onClick={onCreateClick}>
            {t("social.create")}
          </Button>
        }
      />
    );
  }

  if (contentFormat === "journals") {
    return (
      <>
        {posts.map((post) => (
          <JournalCard
            key={post.id}
            post={post}
            formatDate={formatDate}
            onTagClick={(tag) => onTagClick(tag)}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          user={user}
          bookmarked={bookmarkedSet.has(post.id)}
          expanded={Boolean(expandedComments[post.id])}
          commentText={commentInputs[post.id] || ""}
          formatDate={formatDate}
          likePending={likePending}
          commentPending={commentPending}
          onToggleComments={() => onToggleComments(post.id)}
          onCommentChange={(value) => onCommentChange(post.id, value)}
          onSubmitComment={() => onSubmitComment(post.id)}
          onLike={() => onLike(post.id, post.isLiked)}
          onBookmark={() => onBookmark(post.id)}
          onTagClick={(tag) => onTagClick(activeTag === tag ? "" : tag)}
        />
      ))}
    </>
  );
}
