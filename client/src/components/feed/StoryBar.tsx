import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isStoryViewed } from "@/lib/story-views";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { TravelPostWithAuthor } from "@shared/schema";
import { cn } from "@/lib/utils";

type StoryGroup = {
  userId: string;
  label: string;
  avatarUrl?: string | null;
  posts: TravelPostWithAuthor[];
};

function groupStories(posts: TravelPostWithAuthor[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const post of posts) {
    const uid = post.userId;
    const existing = map.get(uid);
    const label =
      post.author
        ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "User"
        : "User";
    if (existing) {
      existing.posts.push(post);
    } else {
      map.set(uid, {
        userId: uid,
        label,
        avatarUrl: post.author?.profileImageUrl,
        posts: [post],
      });
    }
  }
  return Array.from(map.values());
}

type StoryBarProps = {
  posts: TravelPostWithAuthor[];
  onOpenGroup: (group: StoryGroup, startIndex: number) => void;
};

export type { StoryGroup };

export default function StoryBar({ posts, onOpenGroup }: StoryBarProps) {
  const groups = groupStories(posts);

  if (!groups.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Пока нет Stories — опубликуйте фото или видео на 24 часа
      </p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {groups.map((group) => {
        const allViewed = group.posts.every((p) => isStoryViewed(p.id));
        return (
          <button
            key={group.userId}
            type="button"
            className="flex flex-col items-center gap-2 shrink-0"
            onClick={() => onOpenGroup(group, 0)}
          >
            <div
              className={cn(
                "p-0.5 rounded-full",
                allViewed ? "bg-muted" : "bg-gradient-to-tr from-ait-purple to-ait-orange",
              )}
            >
              <Avatar className="h-14 w-14 border-2 border-background">
                <AvatarImage src={resolveMediaUrl(group.avatarUrl)} />
                <AvatarFallback>{group.label[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs max-w-[72px] truncate">{group.label}</span>
          </button>
        );
      })}
    </div>
  );
}
