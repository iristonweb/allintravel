import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import { cn } from "@/lib/utils";
import {
  Heart,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import type { MessageReactionMeta } from "@shared/schema";

export type ChatMessageRowProps = {
  messageId: string;
  content: string;
  isOwn: boolean;
  isPinned?: boolean;
  senderLabel?: string;
  senderInitial?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  meta?: MessageReactionMeta;
  canPin?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  onLike?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
  liking?: boolean;
};

export default function ChatMessageRow({
  messageId,
  content,
  isOwn,
  isPinned,
  senderLabel,
  senderInitial,
  createdAt,
  updatedAt,
  meta,
  canPin,
  canDelete,
  canEdit,
  onLike,
  onPin,
  onUnpin,
  onDelete,
  onEdit,
  liking,
}: ChatMessageRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(content);
  const hasActions = Boolean(onLike || onPin || onUnpin || onDelete || onEdit);

  const timeStr = createdAt
    ? format(new Date(createdAt as string), "HH:mm", { locale: ru })
    : "";

  const submitEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === content) {
      setEditOpen(false);
      return;
    }
    onEdit?.(trimmed);
    setEditOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "group flex gap-2",
          isOwn && "flex-row-reverse",
          isPinned && "relative",
        )}
        data-message-id={messageId}
      >
        {senderInitial != null && (
          <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-gradient-to-br from-ait-purple to-ait-orange text-white">
            {senderInitial}
          </div>
        )}
        <div className={cn("flex flex-col max-w-[82%] min-w-0", isOwn && "items-end")}>
          {isPinned && (
            <span className="text-[10px] text-ait-orange font-medium px-1 mb-0.5 flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Закреплено
            </span>
          )}
          <div className="flex items-end gap-1">
            <ChatMessageBubble
              content={content}
              isOwn={isOwn}
              edited={Boolean(updatedAt)}
              senderLabel={
                senderLabel ? (
                  <span className="text-xs text-muted-foreground px-1">{senderLabel}</span>
                ) : undefined
              }
              timestamp={
                <span className="text-[10px] text-muted-foreground px-1">{timeStr}</span>
              }
              likeCount={meta?.likeCount}
              likedByMe={meta?.likedByMe}
              onLike={onLike}
              liking={liking}
            />
            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 shrink-0 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
                      isOwn ? "order-first" : "",
                    )}
                    aria-label="Действия с сообщением"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48">
                  {onLike && (
                    <DropdownMenuItem onClick={onLike} disabled={liking}>
                      <Heart
                        className={cn(
                          "h-4 w-4 mr-2",
                          meta?.likedByMe && "fill-ait-orange text-ait-orange",
                        )}
                      />
                      {meta?.likedByMe ? "Убрать лайк" : "Лайк"}
                    </DropdownMenuItem>
                  )}
                  {canEdit && onEdit && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditText(content);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                  )}
                  {canPin && !isPinned && onPin && (
                    <DropdownMenuItem onClick={onPin}>
                      <Pin className="h-4 w-4 mr-2" />
                      Закрепить
                    </DropdownMenuItem>
                  )}
                  {canPin && isPinned && onUnpin && (
                    <DropdownMenuItem onClick={onUnpin}>
                      <PinOff className="h-4 w-4 mr-2" />
                      Открепить
                    </DropdownMenuItem>
                  )}
                  {canDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать сообщение</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Отмена
            </Button>
            <Button variant="premium" onClick={submitEdit} disabled={!editText.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
