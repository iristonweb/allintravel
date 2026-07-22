import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiRequestJson } from "@/lib/queryClient";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitBadge from "@/components/ait-ui/AitBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import PostComments from "@/components/social/PostComments";
import PostTipButton from "@/components/ait/PostTipButton";
import BoostPostButton from "@/components/ait/BoostPostButton";
import CreatorAvatar from "@/components/ait/CreatorAvatar";
import FormatToolbar from "@/components/rich-text/FormatToolbar";
import { renderRichText } from "@/lib/rich-text";
import { shareUrl } from "@/lib/share";
import { isVideoUrl } from "@/lib/upload-media";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { COMMUNITY_TRAVEL_SRC } from "@/lib/marketing-images";
import { isDemoPostId } from "@/lib/demo-reels-feed";
import { cn } from "@/lib/utils";
import { Bookmark, Heart, MapPin, MessageCircle, Send, Share2 } from "lucide-react";
import type { TravelPostWithAuthor, User } from "@shared/schema";

type FeedPostCardProps = {
  post: TravelPostWithAuthor;
  user?: User | null;
  bookmarked: boolean;
  expanded: boolean;
  commentText: string;
  formatDate: (date: string | Date) => string;
  likePending: boolean;
  commentPending: boolean;
  onToggleComments?: () => void;
  onCommentChange?: (value: string) => void;
  onSubmitComment?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onTagClick?: (tag: string) => void;
  readOnly?: boolean;
  isDemo?: boolean;
};

export default function FeedPostCard({
  post,
  user,
  bookmarked,
  expanded,
  commentText,
  formatDate,
  likePending,
  commentPending,
  onToggleComments,
  onCommentChange,
  onSubmitComment,
  onLike,
  onBookmark,
  onTagClick,
  readOnly = false,
  isDemo = false,
}: FeedPostCardProps) {
  const { t } = useTranslation();
  const actionsDisabled = readOnly || isDemo || isDemoPostId(post.id);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || t("social.traveler")
    : t("social.traveler");

  const isBoosted = Boolean((post as { isBoosted?: boolean }).isBoosted);
  useEffect(() => {
    if (!isBoosted) return;
    void apiRequestJson("POST", `/api/posts/${post.id}/boost-click`).catch(() => {});
  }, [isBoosted, post.id]);

  return (
    <AitSurface padding="none" radius="lg" glow hover className="overflow-hidden">
      <div className="p-card pb-4">
        <div className="flex items-start gap-4">
          <CreatorAvatar
            src={post.author?.profileImageUrl}
            fallback={post.author?.firstName?.[0] || "?"}
            creatorBadge={(post as { creatorBadge?: boolean }).creatorBadge}
            className="h-12 w-12"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-base">{authorName}</h4>
              {(post as { creatorBadge?: boolean }).creatorBadge && (
                <AitBadge tone="pro">PRO</AitBadge>
              )}
              <span className="text-sm text-muted-foreground">
                {formatDate(post.createdAt as unknown as string)}
              </span>
              {(post as { promoteLabel?: string | null }).promoteLabel ? (
                <AitBadge tone="accent">
                  {(post as { promoteLabel?: string }).promoteLabel}
                </AitBadge>
              ) : (post as { isBoosted?: boolean }).isBoosted ? (
                <AitBadge tone="accent">Boost</AitBadge>
              ) : null}
              {actionsDisabled && (
                <Badge variant="outline" className="text-xs">
                  {t("social.demoBadge")}
                </Badge>
              )}
            </div>
            {post.location && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-ait-purple" />
                <span className="text-sm text-muted-foreground">{post.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-card pb-card space-y-5">
        <div>
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {renderRichText(post.content)}
          </p>
        </div>

        {post.images && post.images.length > 0 && resolveMediaUrl(post.images[0]) ? (
          post.images.length > 1 ? (
            <div
              className={cn(
                "grid gap-1.5 rounded-card-lg overflow-hidden -mx-1",
                post.images.length === 2 ? "grid-cols-2" : "grid-cols-2 auto-rows-fr",
              )}
            >
              {post.images.slice(0, 4).map((img, i) => {
                const src = resolveMediaUrl(img);
                if (!src) return null;
                return (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className={cn(
                      "w-full object-cover",
                      post.images!.length >= 3 && i === 0
                        ? "row-span-2 min-h-[280px]"
                        : "min-h-[140px]",
                    )}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-card-lg overflow-hidden -mx-1">
              {isVideoUrl(post.images[0]) ? (
                <video
                  src={resolveMediaUrl(post.images[0])!}
                  className="w-full min-h-[320px] md:min-h-[420px] object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={resolveMediaUrl(post.images[0])!}
                  alt={post.title}
                  className="w-full min-h-[320px] md:min-h-[420px] object-cover"
                />
              )}
            </div>
          )
        ) : (
          <div
            className="rounded-card-lg overflow-hidden -mx-1 min-h-[320px] md:min-h-[420px] bg-cover bg-center"
            style={{ backgroundImage: `url('${COMMUNITY_TRAVEL_SRC}')` }}
          />
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className={cn(
                  "cursor-pointer rounded-full px-3 hover:bg-ait-purple/20 transition-colors",
                  !onTagClick && "cursor-default hover:bg-transparent",
                )}
                onClick={() => onTagClick?.(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="bg-white/10" />

        <div className="flex items-center justify-between gap-2">
          {readOnly ? (
            <p className="text-xs text-muted-foreground">
              {t("social.publicGuidesHint", {
                defaultValue: "Read-only preview — sign in to interact",
              })}
            </p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                disabled={likePending || actionsDisabled}
                title={actionsDisabled ? t("social.demoMode") : undefined}
                className={cn(
                  "rounded-xl h-10 px-3 transition-all duration-300",
                  post.isLiked
                    ? "text-red-500 bg-red-500/10"
                    : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                )}
              >
                <Heart className={`mr-1.5 h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                {post.likesCount > 0 ? post.likesCount : t("social.feed.like")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleComments}
                disabled={actionsDisabled}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                {post.commentsCount > 0 ? post.commentsCount : t("social.feed.comments")}
              </Button>
              {!actionsDisabled && post.author?.id && (
                <PostTipButton
                  postId={post.id}
                  authorId={post.author.id}
                  currentUserId={user?.id}
                />
              )}
              {!actionsDisabled && (
                <BoostPostButton
                  postId={post.id}
                  authorId={post.author?.id ?? ""}
                  currentUserId={user?.id}
                  isBoosted={(post as { isBoosted?: boolean }).isBoosted}
                />
              )}
            </div>
          )}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const shareLink = `${window.location.origin}/post/${post.id}`;
                void shareUrl(shareLink, post.title, post.content.slice(0, 100));
              }}
              className="text-muted-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBookmark}
                disabled={actionsDisabled}
                className={bookmarked ? "text-ait-purple" : "text-muted-foreground"}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {expanded && !readOnly && !actionsDisabled && (
          <div className="border-t pt-3 space-y-3">
            <PostComments postId={post.id} enabled={expanded} />
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
                <AvatarFallback>{user?.firstName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <FormatToolbar
                  value={commentText}
                  onChange={(v) => onCommentChange?.(v)}
                  inputRef={commentInputRef}
                  compact
                />
                <div className="flex gap-2">
                  <Input
                    ref={commentInputRef}
                    placeholder={t("social.feed.commentPlaceholder")}
                    value={commentText}
                    onChange={(e) => onCommentChange?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSubmitComment?.();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="premium"
                    disabled={!commentText.trim() || commentPending}
                    onClick={() => onSubmitComment?.()}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AitSurface>
  );
}
