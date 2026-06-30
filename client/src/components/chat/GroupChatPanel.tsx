import type { Ref } from "react";
import { ArrowLeft, Loader2, MessageCircle, Pin, Send, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UseMutationResult } from "@tanstack/react-query";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import MessageComposer from "@/components/chat/MessageComposer";
import MessageContent from "@/components/chat/MessageContent";
import RoomAvatar from "@/components/chat/RoomAvatar";
import RoomSettingsPanel from "@/components/chat/RoomSettingsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ChatMessageWithSender, ReplyTarget, RoomListItem } from "@/lib/chat-page-types";
import type { ChatRoom, MessageReactionMeta, User } from "@shared/schema";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { cn } from "@/lib/utils";

type BreadcrumbItem = { label: string; href?: string };

type JoinPreview = {
  id: string;
  title: string;
  description?: string | null;
  avatarUrl?: string | null;
  memberCount?: number | null;
};

type GroupChatPanelProps = {
  mobileThreadOpen: boolean;
  onBack?: () => void;
  roomBreadcrumbs: BreadcrumbItem[] | null;
  activeRoom: string;
  activeRoomMeta?: RoomListItem | ChatRoom;
  showRoomInfo: boolean;
  onShowRoomInfoChange: (open: boolean) => void;
  currentUser?: User | null;
  onLeftRoom: () => void;
  latestPinned?: ChatMessageWithSender;
  pinnedMessages: ChatMessageWithSender[];
  pinnedIds: string[];
  onScrollToMessage: (messageId: string) => void;
  joinRequired: boolean;
  joinPreview?: JoinPreview;
  joinRoomMutation: { mutate: (roomId: string) => void; isPending: boolean };
  historyLoading: boolean;
  historyError: boolean;
  historyErrorMessage?: string;
  onRefetchHistory: () => void;
  allMessages: ChatMessageWithSender[];
  chatBgClass: string;
  scrollRef: Ref<HTMLDivElement>;
  roomId?: string;
  isRoomAdmin: boolean;
  reactionMutation: UseMutationResult<
    MessageReactionMeta,
    Error,
    { messageId: string; emoji: string | null }
  >;
  pinMutation: UseMutationResult<void, Error, { messageId: string; pin: boolean }>;
  deleteMutation: UseMutationResult<void, Error, string>;
  editMutation: UseMutationResult<unknown, Error, { messageId: string; content: string }>;
  onStartReply: (msg: ChatMessageWithSender, label: string, username?: string | null) => void;
  showLegacyJoinHint: boolean;
  messageText: string;
  onMessageTextChange: (value: string) => void;
  onSend: (content?: string) => void | Promise<void>;
  canSend: boolean;
  mentionSuggestUsers: User[];
  replyTo: ReplyTarget | null;
  onCancelReply: () => void;
};

export default function GroupChatPanel({
  mobileThreadOpen,
  onBack,
  roomBreadcrumbs,
  activeRoom,
  activeRoomMeta,
  showRoomInfo,
  onShowRoomInfoChange,
  currentUser,
  onLeftRoom,
  latestPinned,
  pinnedMessages,
  pinnedIds,
  onScrollToMessage,
  joinRequired,
  joinPreview,
  joinRoomMutation,
  historyLoading,
  historyError,
  historyErrorMessage,
  onRefetchHistory,
  allMessages,
  chatBgClass,
  scrollRef,
  roomId,
  isRoomAdmin,
  reactionMutation,
  pinMutation,
  deleteMutation,
  editMutation,
  onStartReply,
  showLegacyJoinHint,
  messageText,
  onMessageTextChange,
  onSend,
  canSend,
  mentionSuggestUsers,
  replyTo,
  onCancelReply,
}: GroupChatPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      {roomBreadcrumbs && (
        <div className="px-4 pt-3 pb-0 border-b border-white/5">
          <AppBreadcrumbs items={roomBreadcrumbs} className="mb-0" />
        </div>
      )}
      <div className="ait-chat-panel-header p-4 flex items-center gap-3">
        {mobileThreadOpen && onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label={t("chat.page.backToList")}
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <RoomAvatar
          title={activeRoomMeta?.title ?? activeRoom}
          avatarUrl={activeRoomMeta?.avatarUrl}
          className="h-16 w-16"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{activeRoomMeta?.title ?? activeRoom}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {activeRoomMeta?.description ?? t("chat.page.group.defaultDescription")}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          title={t("chat.page.group.settings")}
          aria-label={t("chat.page.group.settings")}
          onClick={() => onShowRoomInfoChange(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Sheet open={showRoomInfo} onOpenChange={onShowRoomInfoChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>{t("chat.page.group.settings")}</SheetTitle>
          </SheetHeader>
          {activeRoomMeta && (
            <RoomSettingsPanel
              room={activeRoomMeta as RoomListItem}
              currentUserId={currentUser?.id}
              onClose={() => onShowRoomInfoChange(false)}
              onLeft={() => {
                onShowRoomInfoChange(false);
                onLeftRoom();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {latestPinned?.id && (
        <button
          type="button"
          onClick={() => onScrollToMessage(latestPinned.id!)}
          className="mx-4 mt-2 flex items-center gap-2 rounded-xl border border-ait-orange/30 bg-ait-orange/10 px-3 py-2 text-left hover:bg-ait-orange/15 transition-colors"
        >
          <Pin className="h-3.5 w-3.5 shrink-0 text-ait-orange" />
          <span className="text-xs text-ait-orange font-semibold shrink-0">
            {t("chat.page.group.pinned")}
          </span>
          <span className="text-sm truncate flex-1 min-w-0 text-foreground/90">
            <MessageContent content={latestPinned.content} compact />
          </span>
          {pinnedMessages.length > 1 && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              +{pinnedMessages.length - 1}
            </Badge>
          )}
        </button>
      )}

      <ScrollArea className={cn("flex-1 p-4", chatBgClass)}>
        {joinRequired && joinPreview ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-6 space-y-4">
            <RoomAvatar
              title={joinPreview.title}
              avatarUrl={joinPreview.avatarUrl}
              className="h-20 w-20"
            />
            <div>
              <h3 className="text-lg font-semibold">{joinPreview.title}</h3>
              {joinPreview.description && (
                <p className="text-sm text-muted-foreground mt-1">{joinPreview.description}</p>
              )}
              {joinPreview.memberCount != null && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t("chat.joinGate.memberCount", { count: joinPreview.memberCount })}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">{t("chat.joinGate.title")}</p>
            <Button
              type="button"
              variant="premium"
              disabled={joinRoomMutation.isPending}
              onClick={() => joinRoomMutation.mutate(joinPreview.id)}
            >
              {joinRoomMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("chat.joinGate.joinButton")
              )}
            </Button>
          </div>
        ) : historyLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">{t("chat.page.loading.messages")}</p>
          </div>
        ) : historyError ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-3 px-4 text-center">
            <p className="text-sm">{historyErrorMessage ?? t("chat.page.errors.history")}</p>
            <Button variant="outline" size="sm" onClick={() => onRefetchHistory()}>
              {t("chat.page.errors.retry")}
            </Button>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">{t("chat.page.empty.startTripChat")}</p>
          </div>
        ) : (
          <div className="ait-chat-thread-inner space-y-4">
            {allMessages.map((msg) => {
              const isOwn = msg.userId === currentUser?.id;
              const isPinned = Boolean(msg.id && pinnedIds.includes(msg.id));
              const senderName = isOwn
                ? currentUser
                  ? getUserDisplayLabel(currentUser)
                  : t("chat.page.group.me")
                : msg.sender
                  ? getUserDisplayLabel(msg.sender)
                  : t("chat.page.group.traveler");
              const senderInitial = isOwn
                ? currentUser
                  ? getUserInitial(currentUser)
                  : t("chat.page.group.me")
                : msg.sender
                  ? getUserInitial(msg.sender)
                  : "?";
              const senderAvatarUrl = isOwn
                ? currentUser?.profileImageUrl
                : msg.sender?.profileImageUrl;

              return (
                <ChatMessageRow
                  key={msg.id || `msg-${msg.content.slice(0, 8)}`}
                  messageId={msg.id ?? `tmp-${msg.createdAt}`}
                  content={msg.content}
                  isOwn={isOwn}
                  isPinned={isPinned}
                  senderLabel={!isOwn ? senderName : undefined}
                  senderInitial={senderInitial}
                  senderAvatarUrl={senderAvatarUrl}
                  createdAt={msg.createdAt}
                  updatedAt={msg.updatedAt}
                  meta={{ reactions: msg.reactions ?? [] }}
                  deliveryStatus={msg.deliveryStatus}
                  canPin={Boolean(roomId && (isOwn || isRoomAdmin))}
                  canDelete={isOwn || isRoomAdmin}
                  canEdit={isOwn}
                  onReact={
                    msg.id
                      ? (emoji) => reactionMutation.mutate({ messageId: msg.id!, emoji })
                      : undefined
                  }
                  insightsUrl={
                    roomId && msg.id
                      ? `/api/chat/rooms/${roomId}/messages/${msg.id}/insights`
                      : undefined
                  }
                  onPin={
                    msg.id && roomId && !isPinned
                      ? () => pinMutation.mutate({ messageId: msg.id!, pin: true })
                      : undefined
                  }
                  onUnpin={
                    msg.id && isPinned
                      ? () => pinMutation.mutate({ messageId: msg.id!, pin: false })
                      : undefined
                  }
                  onDelete={msg.id ? () => deleteMutation.mutate(msg.id!) : undefined}
                  onEdit={
                    msg.id
                      ? (c) => editMutation.mutate({ messageId: msg.id!, content: c })
                      : undefined
                  }
                  reacting={
                    reactionMutation.isPending && reactionMutation.variables?.messageId === msg.id
                  }
                  onReply={
                    !isOwn && msg.sender?.username
                      ? () => onStartReply(msg, senderName, msg.sender?.username)
                      : undefined
                  }
                />
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {!joinRequired && (
        <div className="ait-chat-panel-header p-4 border-t">
          {showLegacyJoinHint && (
            <p className="text-xs text-muted-foreground mb-2 px-1">{t("chat.legacy.joinHint")}</p>
          )}
          <div className="flex gap-2 items-center">
            <MessageComposer
              value={messageText}
              onChange={onMessageTextChange}
              onSend={(content) => void onSend(content)}
              placeholder={
                canSend
                  ? t("chat.page.group.messagePlaceholder")
                  : t("chat.page.group.connectingPlaceholder")
              }
              disabled={!canSend}
              className="flex-1"
              suggestUsers={mentionSuggestUsers}
              replyTo={replyTo}
              onCancelReply={onCancelReply}
            />
            <Button
              variant="premium"
              size="icon"
              onClick={() => void onSend()}
              disabled={!messageText.trim() || !canSend}
              className="rounded-2xl shrink-0 shadow-lg"
              aria-label={t("chat.page.sendMessage")}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
