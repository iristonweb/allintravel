import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Compass, MapPin, PenLine, Users } from "lucide-react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import type { TravelPostWithAuthor } from "@shared/schema";

function excerpt(text: string, max = 140) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function Blog() {
  const { data: posts = [], isLoading } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { public: "1", limit: 30 }],
  });

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Блог"
          description="Истории путешественников, маршруты и практические советы."
        />
        <Button variant="premium" className="shrink-0" asChild>
          <Link href="/social-feed">
            <PenLine className="h-4 w-4 mr-2" />
            Написать статью
          </Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-center py-12 mt-8">Загрузка статей…</p>
      )}

      {!isLoading && posts.length === 0 && (
        <GlassCard className="p-8 text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Пока нет публичных статей. Опубликуйте пост в ленте с включённой видимостью «Публично».
          </p>
          <Button variant="premium" asChild>
            <Link href="/social-feed">Перейти в ленту</Link>
          </Button>
        </GlassCard>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {posts.map((article) => (
          <Link key={article.id} href={`/blog/${article.id}`}>
            <GlassCard className="p-6 flex flex-col gap-3 h-full cursor-pointer hover:border-ait-purple/30 transition-colors">
              {article.images?.[0] && (
                <img
                  src={article.images[0]}
                  alt=""
                  className="w-full h-36 object-cover rounded-xl -mt-1 mb-1"
                />
              )}
              {article.tags?.[0] && (
                <span className="text-xs font-medium text-ait-purple">{article.tags[0]}</span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{article.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{excerpt(article.content)}</p>
              <span className="text-xs text-muted-foreground">
                {article.createdAt
                  ? format(new Date(article.createdAt), "d MMMM yyyy", { locale: ru })
                  : ""}
              </span>
            </GlassCard>
          </Link>
        ))}
      </div>

      <div className="mt-12 ait-glass rounded-2xl p-8 flex flex-wrap gap-8 justify-center text-center">
        <div className="flex flex-col items-center gap-2 max-w-[140px]">
          <Compass className="h-8 w-8 text-ait-purple" />
          <span className="text-sm text-muted-foreground">Персональные маршруты</span>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[140px]">
          <MapPin className="h-8 w-8 text-ait-cyan" />
          <span className="text-sm text-muted-foreground">Карты и локации</span>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[140px]">
          <Users className="h-8 w-8 text-ait-pink" />
          <span className="text-sm text-muted-foreground">Сообщество путешественников</span>
        </div>
      </div>
    </AppLayout>
  );
}

export default Blog;
