import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Map, Share2 } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import TravelMap from "@/components/maps/TravelMap";
import { Button } from "@/components/ui/button";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<FogMapData>({
    queryKey: ["/api/passport/fog-map"],
    queryFn: () => apiRequestJson<FogMapData>("GET", "/api/passport/fog-map"),
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const shareText = `Я открыл ${data?.exploredPercent ?? 0}% мира на All In Travel (${data?.exploredCount ?? 0} стран)!`;
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "Моя карта путешествий",
            text: shareText,
            url: window.location.origin,
          });
        } catch {
          /* user cancelled */
        }
      }
      return apiRequestJson<{ granted: boolean; amount: number; fog: FogMapData }>(
        "POST",
        "/api/passport/fog-share",
      );
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["/api/passport/fog-map"], res.fog);
      if (res.granted) {
        toast({ title: `+${res.amount} AIT за шеринг карты!` });
      } else {
        toast({ title: "Шеринг записан (награда уже получена на этой неделе)" });
      }
    },
  });

  if (isLoading || !data) {
    return (
      <GlassCard className="p-6 animate-pulse">
        <div className="h-40 bg-white/5 rounded-xl" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border-ait-purple/20 overflow-hidden relative">
      <div className="flex items-center gap-2 mb-4">
        <Map className="h-5 w-5 text-ait-purple" />
        <h3 className="font-semibold text-lg">Fog of War</h3>
      </div>

      <div className="relative h-44 rounded-2xl overflow-hidden bg-[#0a1628] border border-white/10">
        <TravelMap height="100%" compact className="h-full w-full rounded-2xl opacity-60" />
        <motion.div
          className="absolute inset-0 backdrop-blur-md bg-slate-950/70 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: data.fogLevel / 100 }}
          transition={{ duration: 1.2 }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10 pointer-events-none">
          <p className="text-3xl font-bold text-white">{data.exploredPercent}%</p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.exploredCount} / {data.totalCountries}{" "}
            {t("passport.countries", { defaultValue: "countries" })}
          </p>
        </div>
      </div>

      {data.exploredCountries.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
          {data.exploredCountries.slice(0, 8).join(" · ")}
          {data.exploredCountries.length > 8 ? " …" : ""}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          className="flex-1 gap-2"
          variant="secondary"
          disabled={shareMutation.isPending}
          onClick={() => shareMutation.mutate()}
        >
          <Share2 className="h-4 w-4" />
          {t("passport.fogShare", { defaultValue: "Share map (+25 AIT/wk)" })}
        </Button>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href="/map">{t("passport.openMap", { defaultValue: "Open map" })}</Link>
        </Button>
      </div>
    </GlassCard>
  );
}
