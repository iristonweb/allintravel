import { useRef, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import FormatToolbar from "@/components/rich-text/FormatToolbar";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2, Reply, Eye, Smile } from "lucide-react";
import type {
  MessageDeliveryStatus,
  MessageReactionMeta,
  MessageReadMeta,
  ReactionSummary,
  User,
} from "@shared/schema";
import {
  QUICK_REACTION_EMOJIS,
  DEFAULT_REACTION,
  findMyReaction,
  toggleReactionEmoji,
} from "@/lib/message-reactions";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type ChatMessageRowProps = {
  messageId: string;
  content: string;
  isOwn: boolean;
  isPinned?: boolean;
  senderLabel?: string;
  senderInitial?: string;
  senderAvatarUrl?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  meta?: MessageReactionMeta & Partial<MessageReadMeta>;
  canPin?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  onReact?: (emoji: string | null) => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
  reacting?: boolean;
  insightsUrl?: string;
  deliveryStatus?: MessageDeliveryStatus;
  onReply?: () => void;
};

type InsightsPayload = {
  readCount: number;
  readers: User[];
  reactions: { emoji: string; users: User[] }[];
};

export default function ChatMessageRow({
  messageId,
  content,
  isOwn,
  isPinned,
  senderLabel,
  senderInitial,
  senderAvatarUrl,
  createdAt,
  updatedAt,
  meta,
  canPin,
  canDelete,
  canEdit,
  onReact,
  onPin,
  onUnpin,
  onDelete,
  onEdit,
  reacting,
  insightsUrl,
  deliveryStatus,
  onReply,
}: ChatMessageRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(content);
  const editTextRef = useRef<HTMLTextAreaElement>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const hasActions = Boolean(
    onReact || onReply || onPin || onUnpin || onDelete || onEdit || insightsUrl,
  );

  const { data: insights, isLoading: insightsLoading } = useQuery<InsightsPayload>({
    queryKey: [insightsUrl, messageId],
    enabled: insightsOpen && Boolean(insightsUrl),
    queryFn: async () => {
      const res = await apiRequest("GET", insightsUrl!);
      return res.json();
    },
  });

  const timeStr = createdAt ? format(new Date(createdAt as string), "HH:mm", { locale: ru }) : "";

  const reactions: ReactionSummary[] = meta?.reactions ?? [];
  const myReaction = findMyReaction(reactions);

  const userRow = (u: User) => (
    <li key={u.id} className="flex items-center gap-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} />
        <AvatarFallback className="text-xs bg-primary/20">{getUserInitial(u)}</AvatarFallback>
      </Avatar>
      <span>{getUserDisplayLabel(u)}</span>
    </li>
  );

  const submitEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === content) {
      setEditOpen(false);
      return;
    }
    onEdit?.(trimmed);
    setEditOpen(false);
  };

  const handleQuickReact = (emoji: string) => {
    if (!onReact) return;
    onReact(toggleReactionEmoji(myReaction, emoji));
  };

  const handleDoubleClick = () => {
    if (!onReact) return;
    onReact(toggleReactionEmoji(myReaction, DEFAULT_REACTION));
  };

  const reactionPicker = (
    <div className="flex flex-wrap gap-1 px-2 py-1.5">
      {QUICK_REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={cn(
            "text-lg leading-none p-1 rounded-md hover:bg-accent transition-colors",
            myReaction === emoji && "bg-ait-orange/15 ring-1 ring-ait-orange/40",
          )}
          onClick={() => handleQuickReact(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  const bubble = (
    <ChatMessageBubble
      content={content}
      isOwn={isOwn}
      edited={Boolean(updatedAt)}
      reactions={reactions}
      onReact={onReact ? handleQuickReact : undefined}
      reacting={reacting}
      deliveryStatus={deliveryStatus ?? meta?.deliveryStatus}
      onDoubleClickReact={onReact ? handleDoubleClick : undefined}
      onReactionDetails={insightsUrl ? () => setInsightsOpen(true) : undefined}
      senderLabel={
        senderLabel ? (
          <span className="text-xs text-muted-foreground px-1">{senderLabel}</span>
        ) : undefined
      }
      timestamp={<span className="text-[10px] text-muted-foreground px-1">{timeStr}</span>}
    />
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn("group flex gap-2", isOwn && "flex-row-reverse", isPinned && "relative")}
            data-message-id={messageId}
          >
            {senderInitial != null && (
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={resolveMediaUrl(senderAvatarUrl)} />
                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-ait-purple to-ait-orange text-white">
                  {senderInitial}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn("flex flex-col max-w-[82%] min-w-0", isOwn && "items-end")}>
              {isPinned && (
                <span className="text-[10px] text-ait-orange font-medium px-1 mb-0.5 flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  Закреплено
                </span>
              )}
              <div className="flex items-end gap-1">
                {bubble}
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
                    <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-56">
                      {onReply && (
                        <DropdownMenuItem onClick={onReply}>
                          <Reply className="h-4 w-4 mr-2" />
                          Ответить
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
                      {insightsUrl && (
                        <DropdownMenuItem onClick={() => setInsightsOpen(true)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотры и реакции
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
                      {onReact && (
                        <>
                          {(onReply || onPin || onUnpin || insightsUrl || (canEdit && onEdit)) && (
                            <DropdownMenuSeparator />
                          )}
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Smile className="h-4 w-4 mr-2" />
                              Реакция
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-48">
                              {reactionPicker}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </>
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
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {onReply && (
            <>
              <ContextMenuItem onClick={onReply}>
                <Reply className="h-4 w-4 mr-2" />
                Ответить
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          {canPin && !isPinned && onPin && (
            <ContextMenuItem onClick={onPin}>
              <Pin className="h-4 w-4 mr-2" />
              Закрепить
            </ContextMenuItem>
          )}
          {canPin && isPinned && onUnpin && (
            <ContextMenuItem onClick={onUnpin}>
              <PinOff className="h-4 w-4 mr-2" />
              Открепить
            </ContextMenuItem>
          )}
          {insightsUrl && (
            <ContextMenuItem onClick={() => setInsightsOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Просмотры и реакции
            </ContextMenuItem>
          )}
          {onReact && (
            <>
              <ContextMenuSeparator />
              <ContextMenuLabel>Реакция</ContextMenuLabel>
              {reactionPicker}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Просмотры и реакции</DialogTitle>
          </DialogHeader>
          {insightsLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : insights ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">Просмотрели ({insights.readCount})</p>
                {insights.readers.length === 0 ? (
                  <p className="text-muted-foreground">Пока никто</p>
                ) : (
                  <ul className="space-y-2">{insights.readers.map((u) => userRow(u))}</ul>
                )}
              </div>
              <div>
                <p className="font-medium mb-1">Реакции</p>
                {insights.reactions.length === 0 ? (
                  <p className="text-muted-foreground">Нет реакций</p>
                ) : (
                  <ul className="space-y-3">
                    {insights.reactions.map((g) => (
                      <li key={g.emoji}>
                        <span className="mr-2">{g.emoji}</span>
                        <ul className="mt-1 space-y-1">{g.users.map((u) => userRow(u))}</ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать сообщение</DialogTitle>
          </DialogHeader>
          <FormatToolbar value={editText} onChange={setEditText} inputRef={editTextRef} />
          <Textarea
            ref={editTextRef}
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
