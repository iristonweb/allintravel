import { useState } from "react";
import { Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import AitButton from "@/components/ait-ui/AitButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAitDashboard, useAitTip } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";
import { AIT_TIP_PRESETS, AIT_TIP_CREATOR_SHARE } from "@shared/ait";

type PostTipButtonProps = {
  postId: string;
  authorId: string;
  currentUserId?: string;
};

export default function PostTipButton({ postId, authorId, currentUserId }: PostTipButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data } = useAitDashboard();
  const tipMutation = useAitTip();
  const { toast } = useToast();

  if (!currentUserId || currentUserId === authorId) return null;

  const creatorSharePct = Math.round(AIT_TIP_CREATOR_SHARE * 100);

  const send = (amount: number) => {
    tipMutation.mutate(
      { postId, amount },
      {
        onSuccess: () => {
          toast({ title: t("ait.tip.sent", { amount }) });
          setOpen(false);
        },
        onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AitButton
          variant="ghost"
          size="sm"
          className="gap-1 text-ait-orange hover:text-ait-orange"
        >
          <Gift className="h-4 w-4" />
          {t("ait.tip.button")}
        </AitButton>
      </DialogTrigger>
      <DialogContent className="ait-glass-strong border-white/10 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("ait.tip.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("ait.tip.balance", { amount: data?.spendBalance ?? 0 })}
          <br />
          {t("ait.tip.creatorShare", { pct: creatorSharePct })}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {AIT_TIP_PRESETS.map((n) => (
            <AitButton
              key={n}
              variant="secondary"
              className="rounded-xl border-ait-orange/30"
              disabled={tipMutation.isPending || (data?.spendBalance ?? 0) < n}
              onClick={() => send(n)}
            >
              {n} AIT
            </AitButton>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
