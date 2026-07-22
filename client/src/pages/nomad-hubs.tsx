import PublicLayout from "@/components/public-layout";
import PageMeta from "@/components/seo/PageMeta";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin, ArrowRight } from "lucide-react";

type NomadHub = {
  slug: string;
  city: string;
  country: string;
  nomadScore: number;
  tagline: string;
  highlights: string[];
};

function NomadHubSkeleton() {
  return (
    <AitSurface padding="md" className="space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </AitSurface>
  );
}

export default function NomadHubsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<{ hubs: NomadHub[] }>({
    queryKey: ["/api/gtm/nomad-hubs"],
  });
  const hubs = data?.hubs ?? [];

  return (
    <PublicLayout>
      <PageMeta
        title={t("gtm.nomadHubsTitle")}
        description={t("gtm.nomadHubsSubtitle")}
        path="/nomad-hubs"
      />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="ait-section-title">{t("gtm.nomadHubsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("gtm.nomadHubsSubtitle")}</p>
        </div>
        {isLoading ? (
          <div
            className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
            aria-busy="true"
            aria-label={t("gtm.nomadHubsLoading")}
          >
            {[1, 2, 3].map((i) => (
              <NomadHubSkeleton key={i} />
            ))}
          </div>
        ) : hubs.length === 0 ? (
          <EmptyState variant="glass" icon={MapPin} title={t("gtm.nomadHubsEmpty")} />
        ) : (
          <div className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {hubs.map((hub) => (
              <AitSurface key={hub.slug} padding="md" className="space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{hub.city}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {hub.country}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-[#a78bfa]">{hub.nomadScore}</span>
                </div>
                <p className="text-sm text-slate-300">{hub.tagline}</p>
                <ul className="text-xs text-muted-foreground space-y-1 flex-1">
                  {hub.highlights.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
                <AitButton variant="secondary" className="gap-2 w-full" asChild>
                  <Link href={`/map?q=${encodeURIComponent(hub.city)}`}>
                    {t("nav.map")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </AitButton>
              </AitSurface>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
