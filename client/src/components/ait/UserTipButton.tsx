import { useState } from "react";
import PostTipButton from "@/components/ait/PostTipButton";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAitDashboard } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";
import { apiRequestJson } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AIT_TIP_PRESETS } from "@shared/ait";

type UserTipButtonProps = {
  userId: string;
  currentUserId?: string;
  samplePostId?: string;
};

export default function UserTipButton({
  userId,
  currentUserId,
  samplePostId,
}: UserTipButtonProps) {
  if (!currentUserId || currentUserId === userId) return null;
  if (samplePostId) {
    return <PostTipButton postId={samplePostId} authorId={userId} currentUserId={currentUserId} />;
  }
  return <UserDirectTip userId={userId} />;
}

function UserDirectTip({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useAitDashboard();
  const { toast } = useToast();
  const qc = useQueryClient();

  const tipMutation = useMutation({
    mutationFn: (amount: number) => apiRequestJson("POST", "/api/ait/tip", { userId, amount }),
    onSuccess: () => {
      toast({ title: "Чаевые отправлены" });
      qc.invalidateQueries({ queryKey: ["/api/ait"] });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 rounded-xl border-ait-orange/30">
          <Gift className="h-4 w-4 text-ait-orange" />
          Чаевые
        </Button>
      </DialogTrigger>
      <DialogContent className="ait-glass-strong border-white/10 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Поддержать автора</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Баланс: <strong>{data?.spendBalance ?? 0} AIT</strong>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {AIT_TIP_PRESETS.map((n) => (
            <Button
              key={n}
              variant="outline"
              className="rounded-xl"
              disabled={tipMutation.isPending || (data?.spendBalance ?? 0) < n}
              onClick={() => tipMutation.mutate(n)}
            >
              {n} AIT
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
