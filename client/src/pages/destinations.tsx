import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import PublicLayout from "@/components/public-layout";
import PageShell from "@/components/layout/page-shell";
import GlassCard from "@/components/brand/glass-card";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useTranslation } from "react-i18next";
import { apiRequestJson } from "@/lib/queryClient";

function slugLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DestinationsIndexPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<{ slugs: string[] }>({
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
    <PageShell title={t("destinations.title")} description={t("destinations.description")}>
      {slugs.length === 0 ? (
        <p className="text-muted-foreground">{t("destinations.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slugs.map((slug) => (
            <Link key={slug} href={`/destinations/${slug}`}>
              <GlassCard className="p-card hover:border-primary/40 transition-all duration-300 cursor-pointer h-full ait-hover-lift">
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{slugLabel(slug)}</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
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
