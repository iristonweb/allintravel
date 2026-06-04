import { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAitDashboard, useAitTip } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";
import { AIT_TIP_PRESETS } from "@shared/ait";

type PostTipButtonProps = {
  postId: string;
  authorId: string;
  currentUserId?: string;
};

export default function PostTipButton({ postId, authorId, currentUserId }: PostTipButtonProps) {
  const [open, setOpen] = useState(false);
  const { data } = useAitDashboard();
  const tipMutation = useAitTip();
  const { toast } = useToast();

  if (!currentUserId || currentUserId === authorId) return null;

  const send = (amount: number) => {
    tipMutation.mutate(
      { postId, amount },
      {
        onSuccess: () => {
          toast({ title: `Отправлено ${amount} AIT автору` });
          setOpen(false);
        },
        onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-ait-orange hover:text-ait-orange">
          <Gift className="h-4 w-4" />
          Чаевые
        </Button>
      </DialogTrigger>
      <DialogContent className="ait-glass-strong border-white/10 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Поддержать автора</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ваш баланс: <strong className="text-foreground">{data?.spendBalance ?? 0} AIT</strong>
          <br />
          90% получит автор в Creator AIT
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {AIT_TIP_PRESETS.map((n) => (
            <Button
              key={n}
              variant="outline"
              className="rounded-xl border-ait-orange/30"
              disabled={tipMutation.isPending || (data?.spendBalance ?? 0) < n}
              onClick={() => send(n)}
            >
              {n} AIT
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
