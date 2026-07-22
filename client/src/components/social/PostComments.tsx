import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { renderRichText } from "@/lib/rich-text";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel } from "@shared/user-display";
import type { PostComment } from "@shared/schema";

type PostCommentWithAuthor = PostComment & {
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
};

type PostCommentsProps = {
  postId: string;
  enabled: boolean;
};

export default function PostComments({ postId, enabled }: PostCommentsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
  const { data: comments = [], isLoading, isError } = useQuery<PostCommentWithAuthor[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    enabled,
  });

  if (!enabled) return null;

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground px-1">
        {t("social.comments.loading")}
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive px-1">
        {t("social.comments.loadFailed")}
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1">
        {t("social.comments.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={resolveMediaUrl(comment.author?.profileImageUrl)} />
            <AvatarFallback>
              {comment.author
                ? getUserDisplayLabel(comment.author)[0]?.toUpperCase()
                : comment.userId?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium">
                {comment.author ? getUserDisplayLabel(comment.author) : t("social.traveler")}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.createdAt as unknown as string), "d MMM, HH:mm", {
                  locale: dateLocale,
                })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {renderRichText(comment.content)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
