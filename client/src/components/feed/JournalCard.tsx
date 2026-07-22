import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import PostComments from "@/components/social/PostComments";
import { MapPin, BookOpen, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { renderRichText } from "@/lib/rich-text";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { isDemoPostId } from "@/lib/demo-reels-feed";
import { cn } from "@/lib/utils";
import type { TravelPostWithAuthor, User } from "@shared/schema";

type JournalCardProps = {
  post: TravelPostWithAuthor;
  formatDate: (date: string | Date) => string;
  onTagClick?: (tag: string) => void;
  user?: User | null;
  bookmarked?: boolean;
  expanded?: boolean;
  commentText?: string;
  likePending?: boolean;
  commentPending?: boolean;
  actionsDisabled?: boolean;
  onLike?: () => void;
  onToggleComments?: () => void;
  onCommentChange?: (value: string) => void;
  onSubmitComment?: () => void;
  onBookmark?: () => void;
};

export default function JournalCard({
  post,
  formatDate,
  onTagClick,
  user,
  bookmarked = false,
  expanded = false,
  commentText = "",
  likePending = false,
  commentPending = false,
  actionsDisabled = false,
  onLike,
  onToggleComments,
  onCommentChange,
  onSubmitComment,
  onBookmark,
}: JournalCardProps) {
  const { t } = useTranslation();
  const excerpt = post.content.length > 320 ? `${post.content.slice(0, 320)}…` : post.content;
  const cover = post.images?.[0] ? resolveMediaUrl(post.images[0]) : null;
  const interactive = Boolean(onLike);
  const disabled = actionsDisabled || isDemoPostId(post.id);

  return (
    <AitSurface padding="none" radius="lg" glow hover className="overflow-hidden">
      {cover && (
        <div
          className="h-48 md:h-56 bg-cover bg-center"
          style={{ backgroundImage: `url('${cover}')` }}
        />
      )}
      <div className="p-card">
        <div className="flex items-start gap-4 mb-5">
          <Avatar className="h-11 w-11 border-2 border-white/10">
            <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
            <AvatarFallback>{post.author?.firstName?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
              {disabled && (
                <Badge variant="outline" className="text-xs">
                  {t("social.demoBadge")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(post.createdAt as unknown as string)}
            </p>
          </div>
        </div>
        <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {renderRichText(excerpt)}
        </div>
        {post.location && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-ait-purple" />
            {post.location}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer rounded-full text-xs hover:bg-ait-purple/20 transition-colors"
                onClick={() => onTagClick?.(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        {post.isPublic && (
          <AitButton variant="glass" size="sm" className="mt-5" asChild>
            <Link href={`/post/${post.id}`}>
              <BookOpen className="h-4 w-4 mr-1" />
              {t("social.readArticle", { defaultValue: "Read article" })}
            </Link>
          </AitButton>
        )}

        {interactive && (
          <>
            <Separator className="bg-white/10 my-4" />
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                disabled={likePending || disabled}
                title={disabled ? t("social.demoMode") : undefined}
                className={cn(post.isLiked ? "text-red-500" : "text-muted-foreground")}
              >
                <Heart className={cn("h-4 w-4 mr-1.5", post.isLiked && "fill-current")} />
                {post.likesCount > 0 ? post.likesCount : t("social.feed.like")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleComments}
                disabled={disabled}
                className="text-muted-foreground"
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                {post.commentsCount > 0 ? post.commentsCount : t("social.feed.comments")}
              </Button>
              {onBookmark && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBookmark}
                  disabled={disabled}
                  className={bookmarked ? "text-ait-purple" : "text-muted-foreground"}
                >
                  <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                </Button>
              )}
            </div>
            {expanded && !disabled && (
              <div className="mt-3 space-y-3">
                <PostComments postId={post.id} enabled={expanded} />
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
                    <AvatarFallback>{user?.firstName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
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
                      onClick={onSubmitComment}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AitSurface>
  );
}
