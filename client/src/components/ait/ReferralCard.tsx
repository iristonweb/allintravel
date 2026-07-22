import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Copy, Check, Link2 } from "lucide-react";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequestJson } from "@/lib/queryClient";
import { AIT_REFERRAL_REWARD, type ReferralMilestoneId } from "@shared/ait";
import { useToast } from "@/hooks/use-toast";
import { referralShareUrl } from "@/lib/referral-pending";
import { Link } from "wouter";
import { useTranslation, Trans } from "react-i18next";

type ReferralInvitee = {
  userId: string;
  displayName: string;
  username: string | null;
  profileImageUrl: string | null;
  rewarded: boolean;
  createdAt: string;
};

type ReferralMilestoneProgress = {
  id: ReferralMilestoneId;
  amount: number;
  completedCount: number;
  totalPossible: number;
};

type ReferralInfo = {
  code: string;
  invited: number;
  rewardedCount: number;
  totalEarned: number;
  hasUsedCode: boolean;
  myReferrerCode: string | null;
  invitees: ReferralInvitee[];
  milestones: ReferralMilestoneProgress[];
};

export default function ReferralCard() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const { data, isLoading } = useQuery<ReferralInfo>({
    queryKey: ["/api/ait/referral"],
    queryFn: () => apiRequestJson<ReferralInfo>("GET", "/api/ait/referral"),
  });

  const applyMutation = useMutation({
    mutationFn: (code: string) => apiRequestJson("POST", "/api/ait/referral/apply", { code }),
    onSuccess: () => {
      setCodeInput("");
      qc.invalidateQueries({ queryKey: ["/api/ait"] });
      qc.invalidateQueries({ queryKey: ["/api/ait/referral"] });
    },
    onError: (e: Error) => {
      const msg = e.message.includes("message") ? e.message : e.message.replace(/^\d+:\s*/, "");
      toast({ title: msg || t("ait.referral.applyFailed"), variant: "destructive" });
    },
  });

  const copyCode = () => {
    if (!data?.code) return;
    void navigator.clipboard.writeText(data.code);
    setCopied("code");
    toast({ title: t("ait.referral.codeCopied") });
    setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = () => {
    if (!data?.code) return;
    void navigator.clipboard.writeText(referralShareUrl(data.code));
    setCopied("link");
    toast({ title: t("ait.referral.linkCopied") });
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading || !data) {
    return (
      <AitSurface padding="md" className="border-ait-purple/20 animate-pulse" aria-busy="true" aria-label={t("ait.referral.loading")}>
        <div className="h-24" />
      </AitSurface>
    );
  }

  return (
    <AitSurface padding="md" className="border-ait-purple/20">
      <div className="flex items-start gap-3">
        <Users className="h-8 w-8 text-ait-purple shrink-0" aria-hidden />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-bold text-lg">{t("ait.referral.title")}</h3>
            <p className="text-sm text-muted-foreground">
              <Trans
                i18nKey="ait.referral.description"
                values={{ amount: AIT_REFERRAL_REWARD }}
                components={{ strong: <strong className="text-foreground" /> }}
              />
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="ait-glass px-3 py-2 rounded-xl font-mono text-lg tracking-widest">
              {data.code}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={copyCode}
              aria-label={t("common.copy")}
            >
              {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-1"
              onClick={copyLink}
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {t("ait.referral.link")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{t("ait.referral.invited", { count: data.invited })}</span>
            <span>{t("ait.referral.rewarded", { count: data.rewardedCount })}</span>
            <span className="text-ait-orange font-medium">
              {t("ait.referral.earned", { amount: data.totalEarned })}
            </span>
          </div>

          {data.milestones?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("ait.referral.milestones")}
              </p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {data.milestones.map((m) => (
                  <li
                    key={m.id}
                    className="text-xs ait-glass rounded-lg px-2 py-1.5 flex items-center justify-between gap-2"
                  >
                    <span>{t(`ait.referral.milestonesLabels.${m.id}`)}</span>
                    <span className="text-ait-orange shrink-0">
                      {m.completedCount}/{m.totalPossible || "—"} · +{m.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.hasUsedCode ? (
            <p className="text-sm text-ait-purple bg-ait-purple/10 rounded-xl px-3 py-2">
              {t("ait.referral.codeUsed")}{" "}
              {data.myReferrerCode ? (
                <code className="font-mono">{data.myReferrerCode}</code>
              ) : (
                t("ait.referral.codeUsedFallback")
              )}
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder={t("ait.referral.friendCodePlaceholder")}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                className="ait-glass rounded-xl max-w-[200px]"
              />
              <AitButton
                className="rounded-xl"
                disabled={codeInput.length < 4 || applyMutation.isPending}
                onClick={() => applyMutation.mutate(codeInput)}
              >
                {t("ait.referral.apply")}
              </AitButton>
            </div>
          )}

          {data.invitees.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("ait.referral.yourReferrals")}
              </p>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {data.invitees.map((inv) => (
                  <li
                    key={inv.userId}
                    className="flex items-center justify-between gap-2 text-sm ait-glass rounded-lg px-2 py-1.5"
                  >
                    {inv.username ? (
                      <Link
                        href={`/u/${inv.username}`}
                        className="font-medium hover:text-ait-orange truncate"
                      >
                        {inv.displayName}
                      </Link>
                    ) : (
                      <span className="truncate">{inv.displayName}</span>
                    )}
                    <span
                      className={
                        inv.rewarded
                          ? "text-ait-orange text-xs shrink-0"
                          : "text-muted-foreground text-xs shrink-0"
                      }
                    >
                      {inv.rewarded
                        ? `+${AIT_REFERRAL_REWARD} AIT`
                        : t("ait.referral.pending")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AitSurface>
  );
}
