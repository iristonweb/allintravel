import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import PublicLayout from "@/components/public-layout";
import PageHeader from "@/components/page-header";
import PlaceCard from "@/components/place-card";
import GlassCard from "@/components/brand/glass-card";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useAuth } from "@/hooks/useAuth";
import { apiRequestJson } from "@/lib/queryClient";
import type { DestinationPageData } from "@shared/destinations";
import { Button } from "@/components/ui/button";
import { MapPin, Route } from "lucide-react";

export function DestinationPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<DestinationPageData>({
    queryKey: ["/api/destinations", slug],
    queryFn: () => apiRequestJson("GET", `/api/destinations/${slug}`),
    enabled: !!slug,
  });

  useDocumentMeta(
    data
      ? {
          title: `${data.name} — гид путешественника | All In Travel`,
          description: `Места, маршруты и события в ${data.name}`,
          url: `${window.location.origin}/destinations/${slug}`,
        }
      : null,
  );

  const Layout = isAuthenticated ? AppLayout : PublicLayout;

  if (isLoading) {
    return (
      <Layout>
        <div className="h-48 animate-pulse bg-muted rounded-2xl" />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <p className="text-muted-foreground">Направление не найдено.</p>
      </Layout>
    );
  }

  return (
    <Layout contentClassName="py-8">
      <PageHeader
        title={data.name}
        description="Места, публичные маршруты, события и истории путешественников."
      />

      {data.places.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Топ мест
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}

      {data.trips.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Route className="h-4 w-4" /> Публичные маршруты
          </h2>
          <div className="grid gap-3">
            {data.trips.map((t) => (
              <GlassCard key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-muted-foreground">{t.destination}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/trips/${t.id}/public`}>Открыть</Link>
                </Button>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {data.posts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Истории</h2>
          <div className="grid gap-3">
            {data.posts.map((post) => (
              <GlassCard key={post.id} className="p-4">
                <Link href={`/post/${post.id}`} className="font-medium hover:text-primary">
                  {post.title || "Без названия"}
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}

export default DestinationPage;
