import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { MapPin, AlertCircle, Heart, MessageCircle, Send } from "lucide-react";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import PostDetailSkeleton from "@/components/social/PostDetailSkeleton";
import EmptyState from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostComments from "@/components/social/PostComments";
import { renderRichText } from "@/lib/rich-text";
import type { TravelPostWithAuthor } from "@shared/schema";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import PageMeta from "@/components/seo/PageMeta";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSocialFeedMutations } from "@/hooks/useSocialFeedData";
import { cn } from "@/lib/utils";

export function PostDetailPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/post/:id");
  const postId = params?.id;
  const [commentText, setCommentText] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(true);

  const {
    data: post,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TravelPostWithAuthor>({
    queryKey: [`/api/posts/${postId}`],
    enabled: Boolean(postId),
  });

  const { likePostMutation, commentMutation } = useSocialFeedMutations(new Set());

  const handleLike = () => {
    if (!post || !user) return;
    likePostMutation.mutate({ postId: post.id, isLiked: post.isLiked ?? false });
  };

  const handleComment = () => {
    if (!post) return;
    const content = commentText.trim();
    if (!content) {
      toast({ title: t("social.toasts.commentEmpty"), variant: "destructive" });
      return;
    }
    commentMutation.mutate(
      { postId: post.id, content },
      {
        onSuccess: () => {
          setCommentText("");
          toast({ title: t("social.toasts.commentAdded") });
        },
        onError: () => toast({ title: t("social.toasts.commentFailed"), variant: "destructive" }),
      },
    );
  };

  return (
    <AppLayout rightRail={<DiscoveryRightRail />} columnMaxWidth="feed">
      {post && (
        <PageMeta
          title={post.title}
          description={post.content.slice(0, 160)}
          path={`/post/${post.id}`}
        />
      )}
      <div className="max-w-3xl mx-auto">
        <ReelsPageLayout
          header={
            <div className="space-y-2">
              <Link
                href="/social-feed?format=public"
                className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
              >
                ← {t("social.backToPublic")}
              </Link>
              {post && (
                <AitSectionHeader title={post.title} description={t("social.formats.public")} />
              )}
            </div>
          }
          feed={
            <>
          {isLoading && <PostDetailSkeleton />}

          {!isLoading && (isError || !post) && (
            <EmptyState
              variant="glass"
              icon={AlertCircle}
              title={t("social.articleNotFound")}
              description={isError && error instanceof Error ? error.message : undefined}
              action={
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {isError && (
                    <AitButton variant="glass" size="sm" onClick={() => refetch()}>
                      {t("common.retry")}
                    </AitButton>
                  )}
                  <AitButton variant="primary" size="sm" asChild>
                    <Link href="/social-feed?format=public">{t("social.backToPublic")}</Link>
                  </AitButton>
                </div>
              }
            />
          )}

          {post && !isLoading && (
            <AitSurface radius="lg" className="space-y-0">
            <article>
              {post.images?.[0] && (
                <img
                  src={post.images[0]}
                  alt=""
                  className="w-full max-h-[420px] object-cover rounded-card mb-6"
                />
              )}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
                  <AvatarFallback>{post.author ? getUserInitial(post.author) : "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {post.author ? getUserDisplayLabel(post.author) : t("social.traveler")}
                  </p>
                  {post.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.createdAt), "d MMMM yyyy", { locale: dateLocale })}
                    </p>
                  )}
                </div>
              </div>
              {post.tags?.[0] && (
                <span className="text-xs font-medium text-ait-purple">{post.tags[0]}</span>
              )}
              <h1 className="text-3xl font-bold text-foreground mt-2 mb-4">{post.title}</h1>
              {post.location && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                  <MapPin className="h-4 w-4" />
                  {post.location}
                </p>
              )}
              <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap mb-6">
                {renderRichText(post.content)}
              </div>

              {user ? (
                <div className="border-t border-border/40 pt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <AitButton
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      disabled={likePostMutation.isPending}
                      className={cn(post.isLiked ? "text-red-500" : "text-muted-foreground")}
                    >
                      <Heart className={cn("h-4 w-4 mr-1.5", post.isLiked && "fill-current")} />
                      {post.likesCount > 0 ? post.likesCount : t("social.feed.like")}
                    </AitButton>
                    <AitButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentsOpen((v) => !v)}
                      className="text-muted-foreground"
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5" />
                      {post.commentsCount > 0 ? post.commentsCount : t("social.feed.comments")}
                    </AitButton>
                  </div>
                  {commentsOpen && (
                    <div className="space-y-3">
                      <PostComments postId={post.id} enabled />
                      <div className="flex gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={resolveMediaUrl(user.profileImageUrl)} />
                          <AvatarFallback>{user.firstName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder={t("social.feed.commentPlaceholder")}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleComment();
                              }
                            }}
                          />
                          <AitButton
                            size="sm"
                            variant="primary"
                            disabled={!commentText.trim() || commentMutation.isPending}
                            onClick={handleComment}
                          >
                            <Send className="h-4 w-4" strokeWidth={1.5} />
                          </AitButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-border/40 pt-4 space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4" />
                      {post.likesCount > 0 ? post.likesCount : 0} {t("social.feed.like")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentsCount > 0 ? post.commentsCount : 0} {t("social.feed.comments")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("social.publicGuidesHint", {
                      defaultValue: "Read-only preview — sign in to interact",
                    })}
                  </p>
                  <AitButton variant="primary" size="sm" asChild>
                    <Link href={`/login?redirect=/post/${post.id}`}>
                      {t("nav.login", { defaultValue: "Login" })}
                    </Link>
                  </AitButton>
                </div>
              )}
            </article>
            </AitSurface>
          )}
            </>
          }
        />
      </div>
    </AppLayout>
  );
}

export default PostDetailPage;
