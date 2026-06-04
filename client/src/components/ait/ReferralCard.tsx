import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Copy, Check, Link2 } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequestJson } from "@/lib/queryClient";
import { AIT_REFERRAL_REWARD } from "@shared/ait";
import { useToast } from "@/hooks/use-toast";
import { referralShareUrl } from "@/lib/referral-pending";
import { Link } from "wouter";

type ReferralInvitee = {
  userId: string;
  displayName: string;
  username: string | null;
  profileImageUrl: string | null;
  rewarded: boolean;
  createdAt: string;
};

type ReferralInfo = {
  code: string;
  invited: number;
  rewardedCount: number;
  totalEarned: number;
  hasUsedCode: boolean;
  myReferrerCode: string | null;
  invitees: ReferralInvitee[];
};

export default function ReferralCard() {
  const { toast } = useToast();
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
      toast({ title: msg || "Не удалось применить код", variant: "destructive" });
    },
  });

  const copyCode = () => {
    if (!data?.code) return;
    void navigator.clipboard.writeText(data.code);
    setCopied("code");
    toast({ title: "Код скопирован" });
    setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = () => {
    if (!data?.code) return;
    void navigator.clipboard.writeText(referralShareUrl(data.code));
    setCopied("link");
    toast({ title: "Ссылка скопирована" });
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading || !data) {
    return (
      <GlassCard className="p-5 border-ait-purple/20 animate-pulse">
        <div className="h-24" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 border-ait-purple/20">
      <div className="flex items-start gap-3">
        <Users className="h-8 w-8 text-ait-purple shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-bold text-lg">Пригласи друга</h3>
            <p className="text-sm text-muted-foreground">
              Вы и друг получаете по <strong>{AIT_REFERRAL_REWARD} Spend AIT</strong> после ввода кода.
              Код можно ввести один раз.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="ait-glass px-3 py-2 rounded-xl font-mono text-lg tracking-widest">
              {data.code}
            </code>
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={copyCode}>
              {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={copyLink}>
              {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              Ссылка
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Приглашено: {data.invited}</span>
            <span>Начислено бонусов: {data.rewardedCount}</span>
            <span className="text-ait-orange font-medium">+{data.totalEarned} AIT с рефералов</span>
          </div>

          {data.hasUsedCode ? (
            <p className="text-sm text-ait-purple bg-ait-purple/10 rounded-xl px-3 py-2">
              Вы уже активировали код{" "}
              {data.myReferrerCode ? (
                <code className="font-mono">{data.myReferrerCode}</code>
              ) : (
                "пригласившего"
              )}
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Код друга"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                className="ait-glass rounded-xl max-w-[200px]"
              />
              <Button
                className="ait-btn-glow text-white rounded-xl"
                disabled={codeInput.length < 4 || applyMutation.isPending}
                onClick={() => applyMutation.mutate(codeInput)}
              >
                Применить
              </Button>
            </div>
          )}

          {data.invitees.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ваши рефералы
              </p>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {data.invitees.map((inv) => (
                  <li
                    key={inv.userId}
                    className="flex items-center justify-between gap-2 text-sm ait-glass rounded-lg px-2 py-1.5"
                  >
                    {inv.username ? (
                      <Link href={`/u/${inv.username}`} className="font-medium hover:text-ait-orange truncate">
                        {inv.displayName}
                      </Link>
                    ) : (
                      <span className="truncate">{inv.displayName}</span>
                    )}
                    <span
                      className={
                        inv.rewarded ? "text-ait-orange text-xs shrink-0" : "text-muted-foreground text-xs shrink-0"
                      }
                    >
                      {inv.rewarded ? `+${AIT_REFERRAL_REWARD} AIT` : "ожидает"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
