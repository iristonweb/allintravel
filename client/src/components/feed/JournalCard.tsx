import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { MapPin, BookOpen } from "lucide-react";
import { renderRichText } from "@/lib/rich-text";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { TravelPostWithAuthor } from "@shared/schema";

type JournalCardProps = {
  post: TravelPostWithAuthor;
  formatDate: (date: string | Date) => string;
  onTagClick?: (tag: string) => void;
};

export default function JournalCard({ post, formatDate, onTagClick }: JournalCardProps) {
  const excerpt = post.content.length > 320 ? `${post.content.slice(0, 320)}…` : post.content;
  const cover = post.images?.[0] ? resolveMediaUrl(post.images[0]) : null;

  return (
    <AitSurface padding="none" radius="lg" glow hover className="overflow-hidden">
      {cover && (
        <div
          className="h-48 md:h-56 bg-cover bg-center"
          style={{ backgroundImage: `url('${cover}')` }}
        />
      )}
      <div className="p-card">
        <div className="flex items-start gap-4 mb-5">
          <Avatar className="h-11 w-11 border-2 border-white/10">
            <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
            <AvatarFallback>{post.author?.firstName?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(post.createdAt as unknown as string)}
            </p>
          </div>
        </div>
        <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {renderRichText(excerpt)}
        </div>
        {post.location && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-ait-purple" />
            {post.location}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer rounded-full text-xs hover:bg-ait-purple/20 transition-colors"
                onClick={() => onTagClick?.(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        {post.isPublic && (
          <AitButton variant="glass" size="sm" className="mt-5" asChild>
            <Link href={`/post/${post.id}`}>
              <BookOpen className="h-4 w-4 mr-1" />
              Read article
            </Link>
          </AitButton>
        )}
      </div>
    </AitSurface>
  );
}
