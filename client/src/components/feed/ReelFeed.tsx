import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { isVideoUrl } from "@/lib/upload-media";
import type { TravelPostWithAuthor } from "@shared/schema";

type ReelFeedProps = {
  posts: TravelPostWithAuthor[];
};

export default function ReelFeed({ posts }: ReelFeedProps) {
  if (!posts.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Пока нет Reels — загрузите вертикальное видео
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {posts.map((post) => {
        const url = post.images?.find((u) => isVideoUrl(u)) ?? post.images?.[0];
        const src = url ? resolveMediaUrl(url) : null;
        return (
          <div
            key={post.id}
            className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[80vh] mx-auto"
          >
            {src ? (
              <video
                src={src}
                className="w-full h-full object-cover"
                controls
                playsInline
                autoPlay
                muted
                loop
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/60 text-sm">
                Видео недоступно
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium text-sm">{post.title}</p>
              {post.content?.trim() && post.content.trim() !== " " && (
                <p className="text-white/80 text-xs mt-1 line-clamp-2">{post.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
