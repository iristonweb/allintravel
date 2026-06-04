import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type FollowButtonProps = {
  userId: string;
  size?: "sm" | "default";
};

export default function FollowButton({ userId, size = "sm" }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status } = useQuery<{ isFollowing: boolean }>({
    queryKey: [`/api/follow/${userId}/check`],
    enabled: !!user?.id && user.id !== userId,
  });

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/follow/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/follow/${userId}/check`] });
      toast({ title: "Подписка оформлена" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/follow/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/follow/${userId}/check`] });
      toast({ title: "Подписка отменена" });
    },
  });

  if (!user?.id || user.id === userId) return null;

  const isFollowing = status?.isFollowing ?? false;

  return (
    <Button
      size={size}
      variant={isFollowing ? "outline" : "default"}
      className={!isFollowing ? "bg-primary hover:bg-primary/90" : ""}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      onClick={() => (isFollowing ? unfollowMutation.mutate() : followMutation.mutate())}
    >
      {isFollowing ? (
        <>
          <UserMinus className="mr-1 h-4 w-4" />
          Отписаться
        </>
      ) : (
        <>
          <UserPlus className="mr-1 h-4 w-4" />
          Подписаться
        </>
      )}
    </Button>
  );
}
