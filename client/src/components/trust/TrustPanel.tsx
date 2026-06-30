import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        "rounded-full gap-1 border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#e9d5ff]",
        data.isVerified && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        className,
      )}
    >
      {data.isVerified ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("rounded-xl gap-2", className)}
      disabled={data?.vouchedByMe || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <ShieldCheck className="h-4 w-4" />
      {data?.vouchedByMe ? t("trust.vouched") : t("trust.vouch")}
    </Button>
  );
}

export function TrustPanel({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery<TrustProfile>({
    queryKey: [`/api/trust/${userId}`],
  });

  if (!data) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <TrustBadge userId={userId} />
      <span className="text-sm text-muted-foreground">
        {data.vouchCount} {t("trust.vouches")}
      </span>
      {data.isVerified && (
        <Badge className="rounded-full bg-emerald-600/20 text-emerald-200">
          {t("trust.verified")}
        </Badge>
      )}
      <VouchButton userId={userId} />
    </div>
  );
}
