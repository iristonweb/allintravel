import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import FeedPostCard from "@/components/social/FeedPostCard";
import PageMeta from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { TravelPostWithAuthor } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

const noop = () => {};

/** Read-only public guides feed for guests */
export function PublicSocialFeed() {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "public", limit: "30" }],
  });

  return (
    <AppLayout>
      <PageMeta
        title={t("social.publicGuides", { defaultValue: "Travel guides" })}
        description={t("social.publicGuidesDesc", {
          defaultValue: "Public travel stories and guides from the All In Travel community.",
        })}
        path="/guides"
      />
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {t("social.publicGuides", { defaultValue: "Travel guides" })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("social.publicGuidesHint", {
                defaultValue: "Read-only preview — sign in to interact",
              })}
            </p>
          </div>
          <Button variant="premium" asChild>
            <Link href="/login?redirect=/social-feed">
              {t("nav.login", { defaultValue: "Login" })}
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="h-48 animate-pulse bg-white/5 rounded-2xl" />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                bookmarked={false}
                expanded={false}
                commentText=""
                formatDate={(d) => format(new Date(d), "d MMM")}
                likePending={false}
                commentPending={false}
                onToggleComments={noop}
                onCommentChange={noop}
                onSubmitComment={noop}
                onLike={noop}
                onBookmark={noop}
                onTagClick={noop}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default PublicSocialFeed;
