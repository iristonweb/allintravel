import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/empty-state";
import { Compass } from "lucide-react";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import PublicLayout from "@/components/public-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useTranslation } from "react-i18next";
import { apiRequestJson } from "@/lib/queryClient";

function slugLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DestinationTileSkeleton() {
  return (
    <AitSurface aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded-md shrink-0" />
        <Skeleton className="h-4 w-32" />
      </div>
    </AitSurface>
  );
}

export default function DestinationsIndexPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useQuery<{ slugs: string[] }>({
    queryKey: ["/api/destinations"],
    queryFn: () => apiRequestJson("GET", "/api/destinations"),
  });

  useDocumentMeta({
    title: `${t("destinations.title")} — All In Travel`,
    description: t("destinations.description"),
    url: `${window.location.origin}/destinations`,
  });

  const slugs = data?.slugs ?? [];

  const pageBody = (
    <ReelsPageLayout
      header={
        <AitSectionHeader
          title={t("destinations.title")}
          description={t("destinations.description")}
        />
      }
      feed={
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <DestinationTileSkeleton key={i} />
            ))}
          </div>
        ) : slugs.length === 0 ? (
          <EmptyState
            variant="glass"
            icon={Compass}
            title={t("destinations.empty")}
            description={t("destinations.description")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slugs.map((slug) => (
              <Link key={slug} href={`/destinations/${slug}`}>
                <AitSurface hover className="cursor-pointer h-full">
                  <div className="flex items-center gap-3">
                    <Compass className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} />
                    <span className="font-medium">{slugLabel(slug)}</span>
                  </div>
                </AitSurface>
              </Link>
            ))}
          </div>
        )
      }
    />
  );

  if (isAuthenticated) {
    return (
      <AppLayout contentClassName="py-8" rightRail={<DiscoveryRightRail />}>
        {pageBody}
      </AppLayout>
    );
  }

  return <PublicLayout contentClassName="py-8">{pageBody}</PublicLayout>;
}
