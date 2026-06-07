import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import AppLayout from "@/components/app-layout";
import PublicLayout from "@/components/public-layout";
import PageHeader from "@/components/page-header";
import GlassCard from "@/components/brand/glass-card";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { apiRequestJson } from "@/lib/queryClient";

function slugLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DestinationsIndexPage() {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<{ slugs: string[] }>({
    queryKey: ["/api/destinations"],
    queryFn: () => apiRequestJson("GET", "/api/destinations"),
  });

  useDocumentMeta({
    title: "Направления — All In Travel",
    description: "Гиды по городам и странам: места, маршруты и истории путешественников.",
    url: `${window.location.origin}/destinations`,
  });

  const Layout = isAuthenticated ? AppLayout : PublicLayout;
  const slugs = data?.slugs ?? [];

  return (
    <Layout contentClassName="py-8">
      <PageHeader
        title="Направления"
        description="Исследуйте города и страны — места, публичные маршруты и события от сообщества."
      />
      {slugs.length === 0 ? (
        <p className="text-muted-foreground">Скоро появятся гиды по популярным направлениям.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {slugs.map((slug) => (
            <Link key={slug} href={`/destinations/${slug}`}>
              <GlassCard className="p-4 hover:border-primary/40 transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{slugLabel(slug)}</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
