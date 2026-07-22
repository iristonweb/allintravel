import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Map, Share2, AlertCircle } from "lucide-react";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import RadialScoreRing from "@/components/ui/radial-score-ring";
import { Badge } from "@/components/ui/badge";
import FogMapSkeleton from "@/components/passport/FogMapSkeleton";
import TravelMap from "@/components/maps/TravelMap";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/empty-state";
import { passportPublicUrl, shareUrl } from "@/lib/share";

type FogMapData = {
  exploredCountries: string[];
  exploredCount: number;
  totalCountries: number;
  exploredPercent: number;
  fogLevel: number;
};

export default function FogOfWarMap() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const { data, isLoading, isError, refetch } = useQuery<FogMapData>({
    queryKey: ["/api/passport/fog-map"],
    queryFn: () => apiRequestJson<FogMapData>("GET", "/api/passport/fog-map"),
    enabled: Boolean(user),
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const shareText = t("passport.fogShareText", {
        defaultValue:
          "I've explored {{percent}}% of the world on All In Travel ({{count}} countries)!",
        percent: data?.exploredPercent ?? 0,
        count: data?.exploredCount ?? 0,
      });
      const shareUrlTarget = user?.username
        ? passportPublicUrl(user.username)
        : window.location.origin;

      const outcome = await shareUrl(
        shareUrlTarget,
        t("passport.fogShareTitle", { defaultValue: "My travel map" }),
        shareText,
        { toast: false },
      );

      if (outcome === "cancelled") {
        throw new Error("SHARE_CANCELLED");
      }
      if (outcome === "failed") {
        throw new Error("SHARE_FAILED");
      }

      return apiRequestJson<{ granted: boolean; amount: number; fog: FogMapData }>(
        "POST",
        "/api/passport/fog-share",
      );
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["/api/passport/fog-map"], res.fog);
      if (res.granted) {
        toast({
          title: t("passport.fogShareReward", {
            defaultValue: "+{{amount}} AIT for sharing your map!",
            amount: res.amount,
          }),
        });
      } else {
        toast({
          title: t("passport.fogShareRecorded", {
            defaultValue: "Share recorded (weekly reward already claimed)",
          }),
        });
      }
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "SHARE_CANCELLED") return;
      toast({
        title: t("passport.fogShareError", {
          defaultValue: "Could not record map share",
        }),
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  if (isLoading) {
    return <FogMapSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        variant="glass"
        icon={AlertCircle}
        title={t("passport.mapLoadError", { defaultValue: "Could not load travel map" })}
        description={t("passport.loadErrorHint", {
          defaultValue: "Check your connection and try again.",
        })}
        action={
          <AitButton variant="glass" size="sm" onClick={() => refetch()}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AitButton>
        }
      />
    );
  }

  return (
    <AitSurface padding="md" radius="card" glow className="overflow-hidden relative">
      <div className="flex items-center gap-2 mb-4">
        <Map className="h-5 w-5 text-ait-purple" strokeWidth={1.5} aria-hidden />
        <h3 className="text-lg font-medium text-foreground leading-snug">
          {t("passport.fogOfWar", { defaultValue: "Fog of War" })}
        </h3>
      </div>

      <div className="relative h-40 sm:h-44 rounded-card-xl overflow-hidden bg-ait-deep border border-border/50">
        <TravelMap height="100%" compact className="h-full w-full rounded-card-xl opacity-60" />
        <motion.div
          className="absolute inset-0 backdrop-blur-md bg-slate-950/70 pointer-events-none"
          initial={{ opacity: reduceMotion ? data.fogLevel / 100 : 1 }}
          animate={{ opacity: data.fogLevel / 100 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2 }}
        />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <RadialScoreRing
            value={data.exploredPercent}
            max={100}
            size={88}
            strokeWidth={6}
            subLabel={t("passport.exploredWorld", {
              defaultValue: "{{count}} / {{total}} countries",
              count: data.exploredCount,
              total: data.totalCountries,
            })}
            ariaLabel={t("passport.exploredAria", {
              defaultValue:
                "Explored {{percent}} percent of the world, {{count}} of {{total}} countries",
              percent: data.exploredPercent,
              count: data.exploredCount,
              total: data.totalCountries,
            })}
            className="bg-ait-deep/60 rounded-full backdrop-blur-sm p-1 max-w-[min(100%,7.5rem)]"
          />
        </div>
      </div>

      {data.exploredCountries.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {data.exploredCountries.slice(0, 12).map((country, index) => (
            <Badge
              key={`${country}-${index}`}
              variant="secondary"
              className="rounded-full border-border/50 bg-card text-xs font-medium"
            >
              {country}
            </Badge>
          ))}
          {data.exploredCountries.length > 12 && (
            <Badge variant="outline" className="rounded-full text-xs border-border/50">
              +{data.exploredCountries.length - 12}
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <AitButton
          variant="glass"
          className="flex-1 gap-2"
          disabled={shareMutation.isPending}
          onClick={() => shareMutation.mutate()}
        >
          <Share2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {t("passport.fogShare", { defaultValue: "Share map (+25 AIT/wk)" })}
        </AitButton>
        <AitButton variant="glass" className="sm:w-auto" asChild>
          <Link href="/map">{t("passport.openMap", { defaultValue: "Open map" })}</Link>
        </AitButton>
      </div>
    </AitSurface>
  );
}
