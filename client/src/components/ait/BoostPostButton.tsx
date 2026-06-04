import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAitDashboard, useAitSpend } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";

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
  const { data } = useAitDashboard();
  const spend = useAitSpend();
  const { toast } = useToast();

  if (!currentUserId || currentUserId !== authorId) return null;
  if (isBoosted) {
    return (
      <span className="text-xs text-ait-orange font-semibold flex items-center gap-1">
        <Rocket className="h-3 w-3" />
        Boost 24ч
      </span>
    );
  }

  const cost = data?.catalog.find((c) => c.sku === "boost_post_24h")?.cost ?? 200;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs gap-1 text-ait-purple"
      disabled={spend.isPending || (data?.spendBalance ?? 0) < cost}
      onClick={() =>
        spend.mutate(
          { sku: "boost_post_24h", postId },
          {
            onSuccess: () => toast({ title: "Пост поднят в ленте на 24ч" }),
            onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
          },
        )
      }
    >
      <Rocket className="h-3 w-3" />
      Boost · {cost} AIT
    </Button>
  );
}
