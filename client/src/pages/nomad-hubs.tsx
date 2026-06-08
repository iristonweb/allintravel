import PublicLayout from "@/components/public-layout";
import PageMeta from "@/components/seo/PageMeta";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
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

export default function NomadHubsPage() {
  const { t } = useTranslation();
  const { data } = useQuery<{ hubs: NomadHub[] }>({
    queryKey: ["/api/gtm/nomad-hubs"],
  });

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.hubs ?? []).map((hub) => (
            <GlassCard key={hub.slug} className="p-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{hub.city}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
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
              <Button asChild variant="outline" className="rounded-xl gap-2 w-full">
                <Link href={`/map?q=${encodeURIComponent(hub.city)}`}>
                  {t("nav.map")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
