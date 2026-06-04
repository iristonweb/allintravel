import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, BookOpen } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { renderRichText } from "@/lib/rich-text";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { TravelPostWithAuthor } from "@shared/schema";
type JournalCardProps = {
  post: TravelPostWithAuthor;
  formatDate: (date: string | Date) => string;
  onTagClick?: (tag: string) => void;
};

export default function JournalCard({ post, formatDate, onTagClick }: JournalCardProps) {
  const excerpt =
    post.content.length > 320 ? `${post.content.slice(0, 320)}…` : post.content;

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Avatar>
            <AvatarImage src={resolveMediaUrl(post.author?.profileImageUrl)} />
            <AvatarFallback>{post.author?.firstName?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(post.createdAt as unknown as string)}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {renderRichText(excerpt)}
        </div>
        {post.location && (
          <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {post.location}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer text-xs"
                onClick={() => onTagClick?.(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        {post.isPublic && (
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={`/blog/${post.id}`}>
              <BookOpen className="h-4 w-4 mr-1" />
              Читать в блоге
            </Link>
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
