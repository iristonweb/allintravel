import AppLayout from "@/components/app-layout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import { useAuth } from "@/hooks/useAuth";
import { useAitDashboard } from "@/hooks/useAit";
import { apiRequestJson, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PREMIUM_PLANS, type PremiumPlanId } from "@shared/premium";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export function PremiumPage() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { data: ait } = useAitDashboard(isAuthenticated);
  const { toast } = useToast();
  const locale = i18n.language?.startsWith("ru") ? "ru-RU" : "en-US";
  const totalBalance = (ait?.spendBalance ?? 0) + (ait?.creatorBalance ?? 0);
  const isPremium = Boolean(user?.isPremium);

  const purchase = useMutation({
    mutationFn: (planId: PremiumPlanId) =>
      apiRequestJson<{ ok: boolean; isPremium?: boolean }>("POST", "/api/premium/purchase", {
        planId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
      toast({ title: t("premium.purchaseSuccess", { defaultValue: "Premium activated" }) });
    },
    onError: (e: Error) => {
      toast({
        title: e.message || t("premium.purchaseFailed", { defaultValue: "Purchase failed" }),
        variant: "destructive",
      });
    },
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <AitSectionHeader
          title={t("premium.title", { defaultValue: "AllInTravel Premium" })}
          description={t("premium.subtitle", {
            defaultValue: "Unlock badge, themes, and creator perks — pay with AIT",
          })}
        />

        {isPremium && (
          <AitSurface padding="md" className="border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-300">
              {t("premium.alreadyActive", { defaultValue: "Premium is active on your account" })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("premium.extendHint", {
                defaultValue: "You can still extend with a monthly or yearly plan",
              })}
            </p>
          </AitSurface>
        )}

        <p className="text-sm text-muted-foreground">
          {t("premium.balanceLabel", { defaultValue: "Your AIT balance" })}:{" "}
          <span className="font-semibold text-foreground">
            {totalBalance.toLocaleString(locale)} AIT
          </span>
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {PREMIUM_PLANS.map((plan) => {
            const canAfford = totalBalance >= plan.costAit;
            const lifetimeOwned =
              plan.id === "lifetime" &&
              isPremium &&
              user?.premiumUntil &&
              new Date(user.premiumUntil).getFullYear() >= 9999;
            return (
              <AitSurface
                key={plan.id}
                padding="md"
                className="flex flex-col gap-3 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ait-orange" aria-hidden />
                  <h2 className="font-semibold">
                    {t(plan.titleKey, { defaultValue: plan.titleDefault })}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {t(plan.descriptionKey, { defaultValue: plan.descriptionDefault })}
                </p>
                <p className="text-lg font-bold text-ait-purple">
                  {plan.costAit.toLocaleString(locale)} AIT
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {[
                    t("premium.perkBadge", { defaultValue: "Premium badge" }),
                    t("premium.perkTheme", { defaultValue: "Aurora theme" }),
                    t("premium.perkRoom", { defaultValue: "Extra chat room" }),
                  ].map((label) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-400" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
                <AitButton
                  variant="primary"
                  className="w-full"
                  disabled={!isAuthenticated || lifetimeOwned || !canAfford || purchase.isPending}
                  onClick={() => purchase.mutate(plan.id)}
                >
                  {lifetimeOwned
                    ? t("premium.owned", { defaultValue: "Owned" })
                    : !canAfford
                      ? t("premium.insufficient", { defaultValue: "Not enough AIT" })
                      : t("premium.buy", { defaultValue: "Activate" })}
                </AitButton>
              </AitSurface>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/wallet" className="text-ait-purple hover:underline">
            {t("premium.toWallet", { defaultValue: "Open AIT wallet & shop →" })}
          </Link>
        </p>
      </div>
    </AppLayout>
  );
}

export default PremiumPage;
