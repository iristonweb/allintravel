import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { isVideoUrl } from "@/lib/upload-media";
import { markStoryViewed } from "@/lib/story-views";
import type { TravelPostWithAuthor } from "@shared/schema";

type StoryViewerProps = {
  posts: TravelPostWithAuthor[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export default function StoryViewer({ posts, index, onClose, onIndexChange }: StoryViewerProps) {
  const post = posts[index];
  const media = post?.images?.[0];

  useEffect(() => {
    if (post?.id) markStoryViewed(post.id);
  }, [post?.id]);

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-medium truncate">{post.title}</span>
        <Button variant="ghost" size="icon" className="text-white" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-4">
        {index > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 text-white z-10"
            onClick={() => onIndexChange(index - 1)}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {media && resolveMediaUrl(media) ? (
          isVideoUrl(media) ? (
            <video
              src={resolveMediaUrl(media)!}
              className="max-h-[80vh] max-w-full rounded-lg"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={resolveMediaUrl(media)!}
              alt=""
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
          )
        ) : (
          <p className="text-white/70">Нет медиа</p>
        )}
        {index < posts.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 text-white z-10"
            onClick={() => onIndexChange(index + 1)}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
      {post.content?.trim() && post.content.trim() !== " " && (
        <p className="p-4 text-white/90 text-sm text-center">{post.content}</p>
      )}
    </div>
  );
}
