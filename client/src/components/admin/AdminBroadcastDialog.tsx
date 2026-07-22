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
import { useTranslation } from "react-i18next";

export default function AdminBroadcastDialog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error(t("admin.broadcast.emptyMessage"));
      const res = await apiRequest("POST", "/api/admin/broadcasts", { content: trimmed });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.broadcast.sentTitle"),
        description: t("admin.broadcast.sentDesc"),
      });
      setContent("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
    },
    onError: (err) => {
      toast({
        title: t("common.error"),
        description: err instanceof Error ? err.message : t("admin.broadcast.sendFailed"),
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5 text-xs h-8">
          <Megaphone className="h-3.5 w-3.5" />
          {t("admin.broadcast.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="ait-glass-strong ait-gradient-border border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.broadcast.title")}</DialogTitle>
          <DialogDescription>{t("admin.broadcast.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <MessageComposer
            value={content}
            onChange={setContent}
            onSend={() => {}}
            persistAfterMediaSend
            placeholder={t("admin.broadcast.placeholder")}
            className="w-full"
          />
          {content.trim() && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-2">{t("admin.broadcast.preview")}</p>
              <MessageContent content={content} className="block space-y-2" />
            </div>
          )}
          <Button
            variant="premium"
            className="w-full"
            disabled={!content.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? t("admin.broadcast.sending") : t("admin.broadcast.sendAll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
