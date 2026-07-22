import PublicLayout from "@/components/public-layout";
import PageMeta from "@/components/seo/PageMeta";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, CreditCard } from "lucide-react";

export default function CreatorsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [niche, setNiche] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery<{
    perks: { id: string; title: string; description: string }[];
  }>({
    queryKey: ["/api/gtm/creators"],
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/gtm/creator-applications", { email, niche, message }),
    onSuccess: () => toast({ title: t("gtm.applicationSubmitted") }),
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
          <Sparkles className="h-10 w-10 mx-auto text-[#ff7a18]" aria-hidden />
          <h1 className="ait-section-title">{t("gtm.creatorsTitle")}</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("gtm.creatorsSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <AitSurface key={i} padding="md" aria-busy="true">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </AitSurface>
            ))
          ) : (data?.perks ?? []).length === 0 ? (
            <EmptyState variant="glass" icon={Sparkles} title={t("gtm.perksEmpty")} />
          ) : (
            (data?.perks ?? []).map((perk) => (
              <AitSurface key={perk.id} padding="md">
                <h3 className="font-semibold text-white">{perk.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{perk.description}</p>
              </AitSurface>
            ))
          )}
        </div>

        {user && (
          <AitSurface padding="md">
            <AitButton
              type="button"
              className="gap-2 w-full sm:w-auto"
              disabled={stripeMutation.isPending}
              onClick={() => stripeMutation.mutate()}
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {t("marketplace.connectStripe")}
            </AitButton>
          </AitSurface>
        )}

        <AitSurface padding="md" className="space-y-4">
          <h2 className="font-semibold text-white">{t("gtm.applyCreator")}</h2>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("gtm.emailPlaceholder")}
            className="rounded-xl"
          />
          <Input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder={t("gtm.nichePlaceholder")}
            className="rounded-xl"
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("gtm.messagePlaceholder")}
            className="rounded-xl min-h-[100px]"
          />
          <AitButton
            type="button"
            className="rounded-xl"
            disabled={applyMutation.isPending || !email}
            onClick={() => applyMutation.mutate()}
          >
            {t("gtm.applyCreator")}
          </AitButton>
        </AitSurface>
      </div>
    </PublicLayout>
  );
}
