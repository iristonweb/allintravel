import AitButton from "@/components/ait-ui/AitButton";
import { Rocket } from "lucide-react";
import { useAitDashboard, useAitSpend, useBoostQuote } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type BoostPostButtonProps = {
  postId: string;
  authorId: string;
  currentUserId?: string;
  isBoosted?: boolean;
};

export default function BoostPostButton({
  postId,
  authorId,
  currentUserId,
  isBoosted,
}: BoostPostButtonProps) {
  const { t } = useTranslation();
  const { data } = useAitDashboard();
  const { data: quote } = useBoostQuote(
    postId,
    Boolean(currentUserId && currentUserId === authorId),
  );
  const spend = useAitSpend();
  const { toast } = useToast();

  if (!currentUserId || currentUserId !== authorId) return null;
  if (isBoosted) {
    return (
      <span className="text-xs text-ait-orange font-semibold flex items-center gap-1">
        <Rocket className="h-3 w-3" />
        {t("ait.boost.active")}
      </span>
    );
  }

  const baseCost = data?.catalog.find((c) => c.sku === "boost_post_24h")?.cost ?? 200;
  const cost = quote?.cost ?? baseCost;
  const totalBalance = (data?.spendBalance ?? 0) + (data?.creatorBalance ?? 0);
  const qsHint =
    quote?.qualityScore != null && quote.cost != null && quote.cost !== baseCost
      ? ` · QS ${quote.qualityScore}`
      : "";

  return (
    <AitButton
      variant="ghost"
      size="sm"
      className="text-xs gap-1 text-ait-purple"
      disabled={spend.isPending || totalBalance < cost || quote === undefined}
      onClick={() =>
        spend.mutate(
          { sku: "boost_post_24h", postId },
          {
            onSuccess: () => toast({ title: t("ait.boost.success") }),
            onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
          },
        )
      }
    >
      <Rocket className="h-3 w-3" />
      {t("ait.boost.label", { cost })}
      {qsHint}
      {(data?.creatorBalance ?? 0) > 0 && (
        <span className="text-muted-foreground ml-0.5">
          ({data?.creatorBalance} C + {data?.spendBalance} S)
        </span>
      )}
    </AitButton>
  );
}
