import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { PostComment } from "@shared/schema";

type PostCommentsProps = {
  postId: string;
  enabled: boolean;
};

export default function PostComments({ postId, enabled }: PostCommentsProps) {
  const { data: comments = [], isLoading } = useQuery<PostComment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    enabled,
  });

  if (!enabled) return null;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground px-1">Загрузка комментариев…</p>;
  }

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground px-1">Пока нет комментариев. Будьте первым!</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{comment.userId?.[0]?.toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium">Путешественник</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.createdAt as unknown as string), "d MMM, HH:mm", { locale: ru })}
              </span>
            </div>
            <p className="text-sm text-foreground/90">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
