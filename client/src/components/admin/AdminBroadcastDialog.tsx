import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MessageComposer from "@/components/chat/MessageComposer";
import MessageContent from "@/components/chat/MessageContent";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminBroadcastDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error("Пустое сообщение");
      const res = await apiRequest("POST", "/api/admin/broadcasts", { content: trimmed });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Рассылка отправлена", description: "Все пользователи увидят объявление." });
      setContent("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
    },
    onError: (err) => {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось отправить",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5 text-xs h-8">
          <Megaphone className="h-3.5 w-3.5" />
          Рассылка
        </Button>
      </DialogTrigger>
      <DialogContent className="ait-glass-strong ait-gradient-border border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Рассылка всем пользователям</DialogTitle>
          <DialogDescription>
            Текст, фото, видео, GIF и emoji — как в чате. Появится компактным окном по центру
            экрана.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <MessageComposer
            value={content}
            onChange={setContent}
            onSend={() => {}}
            persistAfterMediaSend
            placeholder="Текст объявления…"
            className="w-full"
          />
          {content.trim() && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-2">Предпросмотр</p>
              <MessageContent content={content} className="block space-y-2" />
            </div>
          )}
          <Button
            variant="premium"
            className="w-full"
            disabled={!content.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? "Отправка…" : "Отправить всем"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
