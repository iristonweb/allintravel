import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { isVideoUrl } from "@/lib/upload-media";
import { markStoryViewed } from "@/lib/story-views";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import PostComments from "@/components/social/PostComments";
import type { TravelPostWithAuthor } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const STORY_REACTIONS = ["❤️", "🔥", "😂", "👏", "😮"] as const;
const STORY_DURATION_MS = 8000;

type StoryViewerProps = {
  posts: TravelPostWithAuthor[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export default function StoryViewer({ posts, index, onClose, onIndexChange }: StoryViewerProps) {
  const post = posts[index];
  const media = post?.images?.[0];
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localLiked, setLocalLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const progressRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (post?.id) markStoryViewed(post.id);
  }, [post?.id]);

  useEffect(() => {
    if (!post) return;
    setLocalLiked(post.isLiked ?? false);
    setLocalLikes(post.likesCount ?? 0);
    setCommentsOpen(false);
    setCommentText("");
    setProgress(0);
  }, [post]);

  const authorLabel = useMemo(() => {
    if (!post?.author) return "Путешественник";
    return (
      `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "Путешественник"
    );
  }, [post?.author]);

  const expiresLabel = useMemo(() => {
    if (!post?.expiresAt) return null;
    const exp = new Date(post.expiresAt);
    if (exp.getTime() <= Date.now()) return "Истекла";
    return `ещё ${formatDistanceToNow(exp, { locale: ru })}`;
  }, [post?.expiresAt]);

  const goNext = useCallback(() => {
    if (index < posts.length - 1) onIndexChange(index + 1);
    else onClose();
  }, [index, posts.length, onIndexChange, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  useEffect(() => {
    if (!post || commentsOpen) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / STORY_DURATION_MS);
      setProgress(p);
      if (p >= 1) goNext();
      else progressRef.current = window.setTimeout(tick, 50);
    };
    progressRef.current = window.setTimeout(tick, 50);
    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
    };
  }, [post, commentsOpen, goNext]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (localLiked) {
        await apiRequest("DELETE", `/api/posts/${post!.id}/like`);
        return null;
      }
      return apiRequestJson("POST", `/api/posts/${post!.id}/like`);
    },
    onSuccess: () => {
      setLocalLiked((v) => !v);
      setLocalLikes((c) => (localLiked ? Math.max(0, c - 1) : c + 1));
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequestJson("POST", `/api/posts/${post!.id}/comments`, { content }),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post!.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: (emoji: string) =>
      apiRequestJson("POST", `/api/posts/${post!.id}/comments`, { content: emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post!.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const { data: freshPost } = useQuery<TravelPostWithAuthor>({
    queryKey: [`/api/posts/${post?.id}`],
    enabled: Boolean(post?.id),
    staleTime: 10_000,
  });

  const commentsCount = freshPost?.commentsCount ?? post?.commentsCount ?? 0;

  if (!post) return null;

  const handleSendComment = () => {
    const text = commentText.trim();
    if (!text) return;
    commentMutation.mutate(text);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col select-none">
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-safe">
        {posts.map((p, i) => (
          <div key={p.id} className="flex-1 h-0.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className={cn(
                "h-full bg-white transition-all duration-75",
                i < index && "w-full",
                i > index && "w-0",
              )}
              style={i === index ? { width: `${progress * 100}%` } : undefined}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 pt-8 text-white z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 border border-white/30">
            <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
            <AvatarFallback>{authorLabel[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{authorLabel}</p>
            {expiresLabel && <p className="text-[10px] text-white/60">{expiresLabel}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white shrink-0"
          onClick={onClose}
          aria-label="Закрыть story"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div
        className="flex-1 flex items-center justify-center relative"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.35) goPrev();
          else goNext();
        }}
      >
        {index > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 text-white z-10 hidden sm:flex"
            aria-label="Предыдущая story"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {media && resolveMediaUrl(media) ? (
          isVideoUrl(media) ? (
            <video
              key={post.id}
              src={resolveMediaUrl(media)!}
              className="max-h-[85vh] max-w-full object-contain"
              controls={false}
              autoPlay
              playsInline
              muted
              loop
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={resolveMediaUrl(media)!}
              alt=""
              className="max-h-[85vh] max-w-full object-contain pointer-events-none"
            />
          )
        ) : (
          <p className="text-white/70 pointer-events-none">Нет медиа</p>
        )}
        {index < posts.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 text-white z-10 hidden sm:flex"
            aria-label="Следующая story"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {post.content?.trim() && post.content.trim() !== " " && (
        <p className="px-4 pb-2 text-white/90 text-sm text-center z-20">{post.content}</p>
      )}

      <div className="z-20 p-4 space-y-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-2">
          {STORY_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="text-2xl hover:scale-125 transition-transform active:scale-95"
              disabled={reactionMutation.isPending}
              onClick={() => reactionMutation.mutate(emoji)}
              title="Быстрая реакция"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 justify-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-white gap-1.5", localLiked && "text-red-400")}
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            <Heart className={cn("h-5 w-5", localLiked && "fill-current")} />
            {localLikes > 0 && <span className="text-xs">{localLikes}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white gap-1.5"
            onClick={() => setCommentsOpen((o) => !o)}
          >
            <MessageCircle className="h-5 w-5" />
            {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
          </Button>
        </div>

        {commentsOpen && (
          <div
            className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-3 max-h-[40vh] overflow-y-auto space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <PostComments postId={post.id} enabled />
            <div className="flex gap-2">
              <Input
                placeholder="Ответить..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              />
              <Button
                size="icon"
                className="shrink-0 bg-ait-orange hover:bg-ait-orange/90"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={handleSendComment}
                aria-label="Отправить комментарий"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
