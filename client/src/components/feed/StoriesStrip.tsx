import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { TravelPostWithAuthor } from "@shared/schema";
import StoryBar, { type StoryGroup } from "@/components/feed/StoryBar";
import StoryViewer from "@/components/feed/StoryViewer";
import GlassCard from "@/components/brand/glass-card";
import { cn } from "@/lib/utils";

type StoriesStripProps = {
  className?: string;
  title?: string;
  compact?: boolean;
};

export default function StoriesStrip({ className, title, compact }: StoriesStripProps) {
  const { user, isAuthenticated } = useAuth();
  const [storyView, setStoryView] = useState<{
    posts: TravelPostWithAuthor[];
    index: number;
  } | null>(null);

  const { data: stories = [] } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "story", limit: "80" }],
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const hasOwnStory = useMemo(
    () => (user?.id ? stories.some((p) => p.userId === user.id) : false),
    [stories, user?.id],
  );

  const openStoryGroup = (group: StoryGroup, startIndex: number) => {
    setStoryView({ posts: group.posts, index: startIndex });
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <GlassCard className={cn("p-4", compact && "p-3", className)}>
        {title && (
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{title}</h2>
            <Link
              href="/social-feed?format=stories"
              className="text-xs text-ait-orange hover:underline"
            >
              Все Stories
            </Link>
          </div>
        )}
        <div className="flex gap-3 items-start overflow-x-auto pb-1 scrollbar-thin">
          <Link href="/social-feed?format=stories&create=1">
            <button
              type="button"
              className="flex flex-col items-center gap-2 shrink-0 group"
              title="Новая Story на 24 часа"
            >
              <div className="h-[60px] w-[60px] rounded-full border-2 border-dashed border-ait-purple/50 flex items-center justify-center bg-ait-purple/10 group-hover:border-ait-orange transition-colors">
                <Plus className="h-7 w-7 text-ait-purple group-hover:text-ait-orange" />
              </div>
              <span className="text-xs max-w-[72px] truncate text-muted-foreground">
                {hasOwnStory ? "Ещё" : "Создать"}
              </span>
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <StoryBar posts={stories} onOpenGroup={openStoryGroup} inline />
          </div>
        </div>
      </GlassCard>

      {storyView && (
        <StoryViewer
          posts={storyView.posts}
          index={storyView.index}
          onClose={() => setStoryView(null)}
          onIndexChange={(index) => setStoryView((s) => (s ? { ...s, index } : null))}
        />
      )}
    </>
  );
}
