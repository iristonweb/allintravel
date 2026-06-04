import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import GlassCard from "@/components/brand/glass-card";
import { Compass, MapPin, Users } from "lucide-react";

const articles = [
  {
    title: "10 маршрутов по Исландии за 12 дней",
    excerpt: "Как собрать кольцевую дорогу, Голубую лагуну и северное сияние в одну поездку.",
    tag: "Маршруты",
    date: "2 июня 2026",
  },
  {
    title: "Где искать попутчиков перед поездкой",
    excerpt: "Сообщество All In Travel помогает найти команду под ваш стиль путешествий.",
    tag: "Сообщество",
    date: "28 мая 2026",
  },
  {
    title: "Офлайн-карты: что скачать заранее",
    excerpt: "Подборка тайлов и чеклист для поездок без стабильного интернета.",
    tag: "Советы",
    date: "15 мая 2026",
  },
];

export function Blog() {
  return (
    <AppLayout>
      <PageHeader
        title="Блог"
        description="Истории путешественников, маршруты и практические советы."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {articles.map((article) => (
          <GlassCard key={article.title} className="p-6 flex flex-col gap-3">
            <span className="text-xs font-medium text-ait-purple">{article.tag}</span>
            <h3 className="text-lg font-semibold text-foreground">{article.title}</h3>
            <p className="text-sm text-muted-foreground flex-1">{article.excerpt}</p>
            <span className="text-xs text-muted-foreground">{article.date}</span>
          </GlassCard>
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
