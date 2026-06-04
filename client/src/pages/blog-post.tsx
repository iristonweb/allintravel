import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin } from "lucide-react";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";
import AppLayout from "@/components/app-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderRichText } from "@/lib/rich-text";
import type { TravelPostWithAuthor } from "@shared/schema";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

export function BlogPostPage() {
  const [, params] = useRoute("/blog/:id");
  const postId = params?.id;

  const { data: post, isLoading, error } = useQuery<TravelPostWithAuthor>({
    queryKey: [`/api/posts/${postId}`],
    enabled: Boolean(postId),
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <AppBreadcrumbs
          items={[
            { label: "Блог", href: "/blog" },
            { label: post?.title ?? "Статья" },
          ]}
        />

        {isLoading && (
          <p className="text-muted-foreground text-center py-12">Загрузка статьи…</p>
        )}

        {!isLoading && (error || !post) && (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Статья не найдена или недоступна.</p>
            <Button variant="link" asChild className="mt-4">
              <Link href="/blog">Вернуться в блог</Link>
            </Button>
          </GlassCard>
        )}

        {post && (
          <article>
            {post.images?.[0] && (
              <img
                src={post.images[0]}
                alt=""
                className="w-full max-h-[420px] object-cover rounded-2xl mb-6"
              />
            )}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
                <AvatarFallback>
                  {post.author ? getUserInitial(post.author) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {post.author ? getUserDisplayLabel(post.author) : "Путешественник"}
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
      </div>
    </AppLayout>
  );
}

export default BlogPostPage;
