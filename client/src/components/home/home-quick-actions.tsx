import { Button } from "@/components/ui/button";
import { Building2, Car, Shield, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import GlassCard from "@/components/brand/glass-card";
import DestinationSearch from "@/components/search/DestinationSearch";
import { useTranslation } from "react-i18next";

type HomeQuickActionsProps = {
  defaultSearch?: string;
};

export default function HomeQuickActions({ defaultSearch = "" }: HomeQuickActionsProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState(defaultSearch);

  const services = useMemo(
    () => [
      { label: t("home.quickActions.hotels"), icon: Building2, href: "/places?type=hotel" },
      { label: t("home.quickActions.restaurants"), icon: Utensils, href: "/places?type=restaurant" },
      { label: t("home.quickActions.transport"), icon: Car, soon: true },
      { label: t("home.quickActions.insurance"), icon: Shield, soon: true },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <DestinationSearch
          value={search}
          onChange={setSearch}
          onNavigate={navigate}
          placeholder={t("home.quickActions.whereTo")}
          inputClassName="ait-glass-strong"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {services.map(({ label, icon: Icon, href, soon }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (soon) {
                toast({
                  title: t("marketing.appDownload.comingSoon"),
                  description: t("home.quickActions.soonHint", { label }),
                });
                return;
              }
              navigate(href!);
            }}
            className="ait-glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/8 transition-colors"
          >
            <Icon className="h-6 w-6 text-ait-purple" />
            <span className="text-xs text-center text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DestinationSearch
            value={search}
            onChange={setSearch}
            onNavigate={navigate}
            placeholder={t("home.quickActions.catalogPlaceholder")}
            inputClassName="ait-glass-strong"
          />
        </div>
        <GlassCard className="p-4 flex items-center justify-center">
          <Button variant="outline" className="w-full" onClick={() => navigate("/map")}>
            {t("home.quickActions.openMap")}
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
