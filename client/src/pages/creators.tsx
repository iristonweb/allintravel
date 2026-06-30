import PublicLayout from "@/components/public-layout";
import PageMeta from "@/components/seo/PageMeta";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, CreditCard } from "lucide-react";

export default function CreatorsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [niche, setNiche] = useState("");
  const [message, setMessage] = useState("");

  const { data } = useQuery<{ perks: { id: string; title: string; description: string }[] }>({
    queryKey: ["/api/gtm/creators"],
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/gtm/creator-applications", { email, niche, message }),
    onSuccess: () => toast({ title: t("common.save") }),
  });

  const stripeMutation = useMutation({
    mutationFn: () => apiRequestJson<{ url: string }>("POST", "/api/marketplace/stripe/connect"),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return (
    <PublicLayout>
      <PageMeta
        title={t("gtm.creatorsTitle")}
        description={t("gtm.creatorsSubtitle")}
        path="/creators"
      />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-4">
          <Sparkles className="h-10 w-10 mx-auto text-[#ff7a18]" />
          <h1 className="ait-section-title">{t("gtm.creatorsTitle")}</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("gtm.creatorsSubtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {(data?.perks ?? []).map((perk) => (
            <GlassCard key={perk.id} className="p-5">
              <h3 className="font-semibold text-white">{perk.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{perk.description}</p>
            </GlassCard>
          ))}
        </div>

        {user && (
          <GlassCard className="p-6">
            <Button
              type="button"
              className="rounded-xl gap-2 w-full sm:w-auto"
              disabled={stripeMutation.isPending}
              onClick={() => stripeMutation.mutate()}
            >
              <CreditCard className="h-4 w-4" />
              {t("marketplace.connectStripe")}
            </Button>
          </GlassCard>
        )}

        <GlassCard className="p-6 space-y-4">
          <h2 className="font-semibold text-white">{t("gtm.applyCreator")}</h2>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="rounded-xl"
          />
          <Input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Routes, guides, photography…"
            className="rounded-xl"
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your audience"
            className="rounded-xl min-h-[100px]"
          />
          <Button
            type="button"
            variant="premium"
            className="rounded-xl"
            disabled={applyMutation.isPending || !email}
            onClick={() => applyMutation.mutate()}
          >
            {t("gtm.applyCreator")}
          </Button>
        </GlassCard>
      </div>
    </PublicLayout>
  );
}
