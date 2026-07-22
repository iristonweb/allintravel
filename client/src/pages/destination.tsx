import { useParams, Link } from "wouter";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import PublicLayout from "@/components/public-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import PlaceCard from "@/components/places/PlaceCard";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useAuth } from "@/hooks/useAuth";
import { apiRequestJson } from "@/lib/queryClient";
import type { DestinationPageData } from "@shared/destinations";
import { useTranslation } from "react-i18next";
import { MapPin, Route } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DestinationPage() {
  const { t } = useTranslation();
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
          title: t("destinations.metaTitle", { name: data.name }),
          description: t("destinations.metaDescription", { name: data.name }),
          url: `${window.location.origin}/destinations/${slug}`,
        }
      : null,
  );

  const layoutProps = isAuthenticated
    ? { rightRail: (<DiscoveryRightRail />) as ReactNode, contentClassName: "py-8" as const }
    : { contentClassName: "py-8" as const };

  if (isLoading) {
    const skeleton = (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full rounded-card-lg" />
      </div>
    );
    return isAuthenticated ? (
      <AppLayout {...layoutProps}>{skeleton}</AppLayout>
    ) : (
      <PublicLayout contentClassName="py-8">{skeleton}</PublicLayout>
    );
  }

  if (!data) {
    return isAuthenticated ? (
      <AppLayout {...layoutProps}>
        <p className="text-muted-foreground">{t("destinations.notFound")}</p>
      </AppLayout>
    ) : (
      <PublicLayout contentClassName="py-8">
        <p className="text-muted-foreground">{t("destinations.notFound")}</p>
      </PublicLayout>
    );
  }

  const mainContent = (
    <ReelsPageLayout
      header={
        <div className="space-y-2">
          <Link
            href="/destinations"
            className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
          >
            ← {t("destinations.title")}
          </Link>
          <AitSectionHeader title={data.name} description={t("destinations.pageDescription")} />
        </div>
      }
      feed={
        <>
      {data.places.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" strokeWidth={1.5} /> {t("destinations.topPlaces")}
          </h2>
          <div className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {data.places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}

      {data.trips.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Route className="h-4 w-4" strokeWidth={1.5} /> {t("destinations.publicRoutes")}
          </h2>
          <div className="grid gap-3">
            {data.trips.map((trip) => (
              <AitSurface key={trip.id} padding="sm" className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{trip.title}</p>
                  <p className="text-sm text-muted-foreground">{trip.destination}</p>
                </div>
                <AitButton variant="glass" size="sm" asChild>
                  <Link href={`/trips/${trip.id}/public`}>{t("common.open")}</Link>
                </AitButton>
              </AitSurface>
            ))}
          </div>
        </section>
      )}

      {data.posts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("destinations.stories")}</h2>
          <div className="grid gap-3">
            {data.posts.map((post) => (
              <AitSurface key={post.id} padding="sm">
                <Link href={`/post/${post.id}`} className="font-medium hover:text-primary">
                  {post.title || t("destinations.untitled")}
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
              </AitSurface>
            ))}
          </div>
        </section>
      )}
        </>
      }
    />
  );

  return isAuthenticated ? (
    <AppLayout {...layoutProps}>{mainContent}</AppLayout>
  ) : (
    <PublicLayout contentClassName="py-8">{mainContent}</PublicLayout>
  );
}

export default DestinationPage;
