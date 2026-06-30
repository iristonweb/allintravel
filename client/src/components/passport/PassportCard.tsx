import { useQuery } from "@tanstack/react-query";
import GlassCard from "@/components/brand/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Plane, Share2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { shareUrl } from "@/lib/share";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export type PassportData = {
  countriesCount: number;
  citiesCount: number;
  tripsCount: number;
  stamps: {
    id: string;
    countryName: string;
    cityName: string | null;
    visitedAt: string | null;
  }[];
  achievements: string[];
};

const ACHIEVEMENT_LABELS: Record<string, string> = {
  explorer: "passport.explorer",
  globetrotter: "passport.globetrotter",
  world_citizen: "passport.worldCitizen",
  city_hopper: "passport.explorer",
  route_builder: "passport.explorer",
};

type PassportCardProps = {
  username?: string | null;
  compact?: boolean;
};

export default function PassportCard({ username, compact }: PassportCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const endpoint = username ? `/api/passport/public/${username}` : "/api/passport/me";

  const { data, isLoading } = useQuery<PassportData>({
    queryKey: [endpoint],
    enabled: Boolean(user) || Boolean(username),
  });

  const handleShare = async () => {
    const handle = username ?? user?.username ?? "me";
    const url = `${window.location.origin}/passport/${handle}`;
    const ok = await shareUrl(url, t("passport.title"));
    toast({
      title: ok ? t("common.copied") : t("passport.shareCard"),
      description: url,
    });
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </GlassCard>
    );
  }

  if (!data) return null;

  return (
    <GlassCard className="p-6 space-y-5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/10 via-transparent to-[#ff7a18]/10 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#a78bfa] mb-1">
            <Globe className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">allintravel</span>
          </div>
          <h2 className="text-xl font-bold text-white">{t("passport.title")}</h2>
          {!compact && (
            <p className="text-sm text-muted-foreground mt-1">{t("passport.subtitle")}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          {t("passport.shareCard")}
        </Button>
      </div>

      <div className="relative grid grid-cols-3 gap-3">
        {[
          { icon: Globe, value: data.countriesCount, label: t("passport.countries") },
          { icon: MapPin, value: data.citiesCount, label: t("passport.cities") },
          { icon: Plane, value: data.tripsCount, label: t("passport.trips") },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center"
          >
            <Icon className="h-4 w-4 mx-auto text-[#ff7a18] mb-1" />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {data.achievements.length > 0 && (
        <div className="relative flex flex-wrap gap-2">
          {data.achievements.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="rounded-full gap-1 bg-[#a78bfa]/20 text-[#e9d5ff]"
            >
              <Trophy className="h-3 w-3" />
              {t(ACHIEVEMENT_LABELS[id] ?? "passport.explorer")}
            </Badge>
          ))}
        </div>
      )}

      {!compact && (
        <div className="relative space-y-2 max-h-48 overflow-y-auto">
          {data.stamps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("passport.empty")}</p>
          ) : (
            data.stamps.slice(0, 12).map((stamp) => (
              <div
                key={stamp.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-white font-medium">
                  {stamp.cityName ? `${stamp.cityName}, ` : ""}
                  {stamp.countryName}
                </span>
                {stamp.visitedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(stamp.visitedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </GlassCard>
  );
}
