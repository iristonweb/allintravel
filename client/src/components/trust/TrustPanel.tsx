import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import RadialScoreRing from "@/components/ui/radial-score-ring";
import { Shield, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type TrustProfile = {
  score: number;
  vouchCount: number;
  isVerified: boolean;
  vouchedByMe?: boolean;
};

type TrustBadgeProps = {
  userId: string;
  showVouch?: boolean;
  className?: string;
};

export function TrustBadge({ userId, className }: TrustBadgeProps) {
  const { t } = useTranslation();
  const { data } = useQuery<TrustProfile>({
    queryKey: [`/api/trust/${userId}`],
  });

  if (!data) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full gap-1 border-ait-purple/40 bg-ait-purple/10 text-foreground",
        data.isVerified && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        className,
      )}
    >
      {data.isVerified ? (
        <ShieldCheck className="h-3 w-3" strokeWidth={1.5} aria-hidden />
      ) : (
        <Shield className="h-3 w-3" strokeWidth={1.5} aria-hidden />
      )}
      {t("trust.score")} {data.score}
    </Badge>
  );
}

export function VouchButton({ userId, className }: TrustBadgeProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery<TrustProfile>({
    queryKey: [`/api/trust/${userId}`],
    enabled: Boolean(user) && user?.id !== userId,
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/trust/${userId}/vouch`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trust/${userId}`] });
    },
  });

  if (!user || user.id === userId) return null;

  return (
    <AitButton
      type="button"
      variant="glass"
      size="sm"
      className={cn("rounded-xl gap-2", className)}
      disabled={data?.vouchedByMe || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      {data?.vouchedByMe ? t("trust.vouched") : t("trust.vouch")}
    </AitButton>
  );
}

type TrustPanelProps = {
  userId: string;
  compact?: boolean;
};

export function TrustPanel({ userId, compact }: TrustPanelProps) {
  const { t } = useTranslation();
  const { data } = useQuery<TrustProfile>({
    queryKey: [`/api/trust/${userId}`],
  });

  if (!data) return null;

  return (
    <AitSurface padding="sm" radius="card" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-4">
        {compact ? (
          <RadialScoreRing
            value={data.score}
            max={100}
            size={72}
            strokeWidth={5}
            label={t("trust.score")}
            ariaLabel={t("trust.scoreAria", {
              defaultValue: "Trust score {{score}} out of 100",
              score: data.score,
            })}
          />
        ) : (
          <TrustBadge userId={userId} />
        )}
        <span className="text-sm text-muted-foreground">
          {data.vouchCount} {t("trust.vouches")}
        </span>
        {data.isVerified && (
          <Badge className="rounded-full bg-emerald-600/20 text-emerald-200 border-emerald-500/30">
            {t("trust.verified")}
          </Badge>
        )}
        <VouchButton userId={userId} />
      </div>
    </AitSurface>
  );
}
