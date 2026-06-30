import { useRef } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/brand/glass-card";
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
  onToggleComments: () => void;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onTagClick: (tag: string) => void;
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
}: FeedPostCardProps) {
  const { t } = useTranslation();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || t("social.traveler")
    : t("social.traveler");

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <CreatorAvatar
            src={post.author?.profileImageUrl}
            fallback={post.author?.firstName?.[0] || "?"}
            creatorBadge={(post as { creatorBadge?: boolean }).creatorBadge}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{authorName}</h4>
              <span className="text-sm text-muted-foreground">
                {formatDate(post.createdAt as unknown as string)}
              </span>
              {(post as { promoteLabel?: string | null }).promoteLabel ? (
                <Badge className="bg-ait-orange/20 text-ait-orange text-xs">
                  {(post as { promoteLabel?: string }).promoteLabel}
                </Badge>
              ) : (post as { isBoosted?: boolean }).isBoosted ? (
                <Badge className="bg-ait-orange/20 text-ait-orange text-xs">Boost</Badge>
              ) : null}
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
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {renderRichText(post.content)}
          </p>
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
            style={{ backgroundImage: `url('${COMMUNITY_TRAVEL_SRC}')` }}
          />
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onTagClick(tag)}
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
              onClick={onLike}
              disabled={likePending}
              className={post.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}
            >
              <Heart className={`mr-1.5 h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              {post.likesCount > 0 ? post.likesCount : t("social.feed.like")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleComments}
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              {post.commentsCount > 0 ? post.commentsCount : t("social.feed.comments")}
            </Button>
            {post.author?.id && (
              <PostTipButton postId={post.id} authorId={post.author.id} currentUserId={user?.id} />
            )}
            <BoostPostButton
              postId={post.id}
              authorId={post.author?.id ?? ""}
              currentUserId={user?.id}
              isBoosted={(post as { isBoosted?: boolean }).isBoosted}
            />
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
              onClick={onBookmark}
              className={bookmarked ? "text-ait-purple" : "text-muted-foreground"}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {expanded && (
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
                  onChange={onCommentChange}
                  inputRef={commentInputRef}
                  compact
                />
                <div className="flex gap-2">
                  <Input
                    ref={commentInputRef}
                    placeholder={t("social.feed.commentPlaceholder")}
                    value={commentText}
                    onChange={(e) => onCommentChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSubmitComment();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="premium"
                    disabled={!commentText.trim() || commentPending}
                    onClick={onSubmitComment}
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
    </GlassCard>
  );
}
