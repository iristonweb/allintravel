import { Link } from "wouter";
import { ChevronRight, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TravelPostWithAuthor } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserInitial } from "@shared/user-display";
import { useTranslation } from "react-i18next";

export default function SocialTeaser() {
  const { t } = useTranslation();
  const { data: stories = [] } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "story", limit: "8" }],
  });

  const previewAuthors = stories.slice(0, 3);

  return (
    <Link href="/social-feed?format=stories">
      <div className="ait-glass-strong rounded-card p-3 flex items-center gap-3 border border-white/10 hover:border-ait-purple/30 transition-colors">
        <div className="flex -space-x-2">
          {previewAuthors.length > 0 ? (
            previewAuthors.map((post) => (
              <Avatar key={post.id} className="h-9 w-9 border-2 border-ait-navy">
                <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
                <AvatarFallback className="text-xs">
                  {post.author ? getUserInitial(post.author) : "?"}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ait-purple/20 border-2 border-dashed border-ait-purple/40">
              <Plus className="h-4 w-4 text-ait-purple" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{t("social.storiesTeaser")}</p>
          <p className="text-xs text-muted-foreground truncate">{t("social.storiesTeaserHint")}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
