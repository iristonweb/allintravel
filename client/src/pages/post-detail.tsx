import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin, AlertCircle } from "lucide-react";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderRichText } from "@/lib/rich-text";
import type { TravelPostWithAuthor } from "@shared/schema";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { useTranslation } from "react-i18next";

export function PostDetailPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/post/:id");
  const postId = params?.id;

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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <PageShell
          title={post?.title ?? t("social.article")}
          breadcrumbs={[
            { label: t("nav.communityHub"), href: "/social-feed" },
            { label: t("social.formats.public"), href: "/social-feed?format=public" },
          ]}
        >
          {isLoading && (
            <p className="text-muted-foreground text-center py-12">{t("social.loadingArticle")}</p>
          )}

          {!isLoading && (isError || !post) && (
            <EmptyState
              icon={AlertCircle}
              title={t("social.articleNotFound")}
              description={isError && error instanceof Error ? error.message : undefined}
              action={
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {isError && (
                    <Button variant="outline" onClick={() => refetch()}>
                      {t("common.retry")}
                    </Button>
                  )}
                  <Button variant="link" asChild>
                    <Link href="/social-feed?format=public">{t("social.backToPublic")}</Link>
                  </Button>
                </div>
              }
            />
          )}

          {post && !isLoading && (
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
                      {format(new Date(post.createdAt), "d MMMM yyyy", { locale: ru })}
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
              <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">
                {renderRichText(post.content)}
              </div>
            </article>
          )}
        </PageShell>
      </div>
    </AppLayout>
  );
}

export default PostDetailPage;
