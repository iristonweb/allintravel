import PublicLayout from "@/components/public-layout";
import PageMeta from "@/components/seo/PageMeta";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Rocket, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function LaunchPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const { data } = useQuery<{
    tagline: string;
    launchDate: string;
    features: string[];
  }>({
    queryKey: ["/api/gtm/product-hunt"],
  });

  const waitlistMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/gtm/launch-waitlist", {
        email,
        locale: i18n.language?.startsWith("ru") ? "ru" : "en",
      }),
    onSuccess: () => toast({ title: t("gtm.notifyLaunch") }),
  });

  return (
    <PublicLayout>
      <PageMeta title={t("gtm.launchTitle")} description={t("gtm.launchSubtitle")} path="/launch" />
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-10 text-center">
        <Rocket className="h-12 w-12 mx-auto text-[#a78bfa]" />
        <div className="space-y-3">
          <h1 className="ait-section-title">{t("gtm.launchTitle")}</h1>
          <p className="text-muted-foreground text-lg">
            {data?.tagline ?? t("gtm.launchSubtitle")}
          </p>
          {data?.launchDate && (
            <p className="text-sm text-[#ff7a18] font-medium">Product Hunt · {data.launchDate}</p>
          )}
        </div>

        <GlassCard className="p-6 text-left space-y-4">
          <ul className="space-y-2">
            {(data?.features ?? []).map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="rounded-xl flex-1"
          />
          <Button
            type="button"
            variant="premium"
            className="rounded-xl shrink-0"
            disabled={waitlistMutation.isPending || !email}
            onClick={() => waitlistMutation.mutate()}
          >
            {t("gtm.notifyLaunch")}
          </Button>
        </div>

        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/login">{t("common.exploreFree")}</Link>
        </Button>
      </div>
    </PublicLayout>
  );
}
