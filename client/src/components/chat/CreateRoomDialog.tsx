import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Camera, Globe, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createChatRoom } from "@/lib/upload-media";
import { useToast } from "@/hooks/use-toast";

type CreateRoomDialogProps = {
  onCreated: (slug: string) => void;
};

export default function CreateRoomDialog({ onCreated }: CreateRoomDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "private",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const { room, avatarWarning } = await createChatRoom({
        title: newRoom.title,
        description: newRoom.description || undefined,
        visibility: newRoom.visibility,
        avatarFile,
      });
      return { room, avatarWarning };
    },
    onSuccess: ({ room, avatarWarning }) => {
      if (avatarWarning) {
        toast({
          title: t("chat.page.createRoom.created"),
          description: avatarWarning,
          variant: "destructive",
        });
      } else {
        toast({ title: t("chat.page.createRoom.created") });
      }
      setOpen(false);
      setNewRoom({ title: "", description: "", visibility: "public" });
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      onCreated(room.slug);
    },
    onError: (err) =>
      toast({
        title: t("chat.page.createRoom.error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label={t("chat.page.sidebar.createGroup")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chat.page.createRoom.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {newRoom.title.slice(0, 1).toUpperCase() || "?"}
              </div>
            )}
            <div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={createRoomMutation.isPending}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-1" />
                {t("chat.page.createRoom.avatar")}
              </Button>
            </div>
          </div>
          <div>
            <Label>{t("chat.page.createRoom.name")}</Label>
            <Input
              value={newRoom.title}
              onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("chat.page.createRoom.description")}</Label>
            <Textarea
              value={newRoom.description}
              onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={newRoom.visibility === "public" ? "default" : "outline"}
              onClick={() => setNewRoom({ ...newRoom, visibility: "public" })}
            >
              <Globe className="h-4 w-4 mr-1" />
              {t("chat.page.createRoom.public")}
            </Button>
            <Button
              type="button"
              variant={newRoom.visibility === "private" ? "default" : "outline"}
              onClick={() => setNewRoom({ ...newRoom, visibility: "private" })}
            >
              <Lock className="h-4 w-4 mr-1" />
              {t("chat.page.createRoom.private")}
            </Button>
          </div>
          {newRoom.visibility === "public" && (
            <p className="text-xs text-muted-foreground">{t("chat.page.createRoom.publicHint")}</p>
          )}
          <Button
            className="w-full"
            onClick={() => createRoomMutation.mutate()}
            disabled={!newRoom.title.trim() || createRoomMutation.isPending}
          >
            {t("chat.page.createRoom.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
