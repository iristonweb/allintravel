import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import MessageContent from "@/components/chat/MessageContent";
import { parseChatMessage } from "@/lib/chat-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminBroadcast } from "@shared/schema";

function contentHasVideo(content: string): boolean {
  return parseChatMessage(content).some((p) => p.type === "video");
}

export default function BroadcastModal() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: broadcast } = useQuery<AdminBroadcast | null>({
    queryKey: ["/api/broadcasts/pending"],
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    setOpen(Boolean(broadcast));
  }, [broadcast?.id]);

  const dismissMutation = useMutation({
    mutationFn: async (action: "ack" | "skip_video") => {
      if (!broadcast?.id) return;
      await apiRequest("POST", `/api/broadcasts/${broadcast.id}/dismiss`, { action });
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/pending"] });
    },
  });

  if (!broadcast) return null;

  const hasVideo = contentHasVideo(broadcast.content);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="ait-glass-strong ait-gradient-border border-white/10 sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2 shrink-0">
          <DialogTitle>Сообщение от команды</DialogTitle>
          <DialogDescription className="sr-only">Объявление для всех пользователей</DialogDescription>
        </DialogHeader>
        <div className="px-5 py-3 overflow-y-auto flex-1 min-h-0 text-sm leading-relaxed text-foreground">
          <MessageContent content={broadcast.content} className="block space-y-3" />
        </div>
        <div className="px-5 pb-5 pt-2 flex flex-wrap gap-2 justify-center shrink-0 border-t border-white/10">
          <Button
            variant="premium"
            onClick={() => dismissMutation.mutate("ack")}
            disabled={dismissMutation.isPending}
          >
            Ясно
          </Button>
          {hasVideo && (
            <Button
              variant="outline"
              onClick={() => dismissMutation.mutate("skip_video")}
              disabled={dismissMutation.isPending}
            >
              Не смотреть
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
