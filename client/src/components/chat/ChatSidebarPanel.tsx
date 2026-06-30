import { Link } from "wouter";
import { Hash, Lock, MessageCircle, Search, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarWithPresence } from "@/components/PresenceDot";
import EmptyState from "@/components/empty-state";
import CreateRoomDialog from "@/components/chat/CreateRoomDialog";
import GroupSearchPreview from "@/components/chat/GroupSearchPreview";
import MessageContent from "@/components/chat/MessageContent";
import RoomAvatar from "@/components/chat/RoomAvatar";
import type { ChatTab, Conversation, DiscoverRoom, RoomListItem } from "@/lib/chat-page-types";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import { cn } from "@/lib/utils";

type JoinRoomMutation = {
  mutate: (roomId: string) => void;
  isPending: boolean;
};

type ChatSidebarPanelProps = {
  chatTab: ChatTab;
  statusLabel: string;
  roomQuery: string;
  onRoomQueryChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  searchPlaceholder: string;
  discoverSearch: string;
  searchFocused: boolean;
  urlDiscoverQ: string;
  discoverRooms: DiscoverRoom[];
  discoverLoading: boolean;
  joinRoomMutation: JoinRoomMutation;
  visibleConversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: boolean;
  refetchConversations: () => void;
  roomsLoading: boolean;
  roomsError: boolean;
  refetchRooms: () => void;
  filteredRooms: RoomListItem[];
  urlWithUserId: string | null;
  activeRoom: string;
  onOpenPersonalChat: (userId: string) => void;
  onSelectRoom: (slug: string) => void;
};

function ChatListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1.5 px-1 py-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function groupFallbackSubtitle(room: RoomListItem, t: TFunction) {
  if (room.description?.trim()) return room.description.trim();
  return t("chat.discover.memberCount", { count: room.memberCount });
}

export default function ChatSidebarPanel({
  chatTab,
  statusLabel,
  roomQuery,
  onRoomQueryChange,
  onSearchFocus,
  onSearchBlur,
  searchPlaceholder,
  discoverSearch,
  searchFocused,
  urlDiscoverQ,
  discoverRooms,
  discoverLoading,
  joinRoomMutation,
  visibleConversations,
  conversationsLoading,
  conversationsError,
  refetchConversations,
  roomsLoading,
  roomsError,
  refetchRooms,
  filteredRooms,
  urlWithUserId,
  activeRoom,
  onOpenPersonalChat,
  onSelectRoom,
}: ChatSidebarPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="ait-chat-panel flex flex-col min-h-0">
      <div className="ait-chat-panel-header p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            {chatTab === "personal" || chatTab === "unread" ? (
              <>
                <MessageCircle className="h-4 w-4 text-ait-purple" />
                {chatTab === "unread"
                  ? t("chat.page.sidebar.unread")
                  : t("chat.page.sidebar.personal")}
              </>
            ) : (
              <>
                <Hash className="h-4 w-4 text-ait-purple" />
                {t("chat.page.sidebar.group")}
              </>
            )}
          </span>
          <div className="flex items-center gap-1">
            {chatTab !== "personal" && chatTab !== "unread" && (
              <CreateRoomDialog onCreated={onSelectRoom} />
            )}
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground"
              title={statusLabel}
            >
              <Wifi className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 mt-1 px-3 pt-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={roomQuery}
            onChange={(e) => onRoomQueryChange(e.target.value)}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            placeholder={searchPlaceholder}
            className="h-9 pl-9 text-sm rounded-2xl ait-glass border-white/10 bg-transparent"
          />
          {chatTab !== "personal" &&
            discoverSearch.length >= 2 &&
            (searchFocused || urlDiscoverQ.length >= 2) && (
              <div
                className="absolute top-full left-0 right-0 z-20 mt-1.5 ait-glass-strong rounded-2xl border border-white/10 shadow-xl overflow-hidden max-h-[min(50vh,320px)] overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                <GroupSearchPreview
                  rooms={discoverRooms}
                  loading={discoverLoading}
                  empty={!discoverLoading && discoverRooms.length === 0}
                  onJoin={(room) => joinRoomMutation.mutate(room.id)}
                  joinPending={joinRoomMutation.isPending}
                />
              </div>
            )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {(chatTab === "personal" || chatTab === "unread") && (
            <>
              {chatTab === "unread" && visibleConversations.length > 0 && (
                <p className="px-2 pb-1 text-xs font-medium text-slate-500">
                  {t("chat.page.sidebar.personalSection")}
                </p>
              )}
              {chatTab === "unread" && conversationsLoading && roomsLoading ? (
                <ChatListSkeleton />
              ) : conversationsLoading ? (
                <ChatListSkeleton count={3} />
              ) : conversationsError ? (
                <div className="py-4 text-center text-sm space-y-2">
                  <p className="text-muted-foreground">{t("chat.page.errors.dialogs")}</p>
                  <Button variant="outline" size="sm" onClick={() => refetchConversations()}>
                    {t("chat.page.errors.retry")}
                  </Button>
                </div>
              ) : (
                visibleConversations.map((conversation) => (
                  <button
                    key={conversation.user.id}
                    type="button"
                    onClick={() => onOpenPersonalChat(conversation.user.id)}
                    className={cn(
                      "ait-chat-room-item w-full text-left",
                      urlWithUserId === conversation.user.id
                        ? "ait-chat-room-item--active"
                        : "text-slate-300 hover:text-slate-100",
                    )}
                  >
                    <AvatarWithPresence
                      src={conversation.user.profileImageUrl}
                      fallback={getUserInitial(conversation.user)}
                      isOnline={conversation.user.isOnline}
                      className="h-12 w-12 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">
                        {getUserDisplayLabel(conversation.user)}
                      </span>
                      {conversation.lastMessage && (
                        <span className="text-[11px] text-muted-foreground block line-clamp-2">
                          <MessageContent content={conversation.lastMessage.content} compact />
                        </span>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="shrink-0 bg-ait-orange border-0 text-[10px] min-w-[1.25rem] justify-center">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))
              )}
              {chatTab === "unread" &&
                visibleConversations.length > 0 &&
                filteredRooms.length > 0 && (
                  <p className="px-2 pt-3 pb-1 text-xs font-medium text-slate-500">
                    {t("chat.page.sidebar.groupsSection")}
                  </p>
                )}
            </>
          )}

          {chatTab !== "personal" && (
            <>
              {chatTab === "unread" &&
              conversationsLoading &&
              roomsLoading ? null : roomsLoading ? (
                <ChatListSkeleton />
              ) : roomsError ? (
                <div className="p-6 text-center text-sm space-y-2">
                  <p className="text-muted-foreground">{t("chat.page.errors.groups")}</p>
                  <Button variant="outline" size="sm" onClick={() => refetchRooms()}>
                    {t("chat.page.errors.retry")}
                  </Button>
                </div>
              ) : filteredRooms.length === 0 ? (
                chatTab === "unread" && visibleConversations.length > 0 ? null : (
                  <EmptyState
                    variant="compact"
                    className="py-4"
                    title={
                      roomQuery.trim()
                        ? discoverSearch.length >= 2
                          ? t("chat.page.empty.noGroupsInSearchDiscover")
                          : t("chat.page.empty.noGroupsInSearch")
                        : chatTab === "mine"
                          ? t("chat.page.empty.notInGroups")
                          : chatTab === "unread"
                            ? t("chat.page.empty.noUnreadGroups")
                            : t("chat.page.empty.noGroups")
                    }
                    action={
                      chatTab === "all" && !roomQuery.trim() ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => onSelectRoom("general")}
                        >
                          {t("chat.page.empty.openGeneralChat")}
                        </Button>
                      ) : undefined
                    }
                  />
                )
              ) : (
                filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onSelectRoom(room.slug)}
                    className={cn(
                      "ait-chat-room-item w-full text-left",
                      activeRoom === room.slug
                        ? "ait-chat-room-item--active"
                        : "text-slate-300 hover:text-slate-100",
                    )}
                  >
                    <RoomAvatar
                      title={room.title}
                      avatarUrl={room.avatarUrl}
                      className="h-12 w-12 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{room.title}</span>
                      <span className="text-[11px] text-muted-foreground block truncate line-clamp-2">
                        {room.lastMessagePreview ? (
                          <MessageContent content={room.lastMessagePreview} compact />
                        ) : (
                          groupFallbackSubtitle(room, t)
                        )}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {(room.unreadCount ?? 0) > 0 && (
                        <Badge className="bg-ait-orange border-0 text-[10px] min-w-[1.25rem] justify-center">
                          {room.unreadCount > 99 ? "99+" : room.unreadCount}
                        </Badge>
                      )}
                      {room.visibility === "private" && <Lock className="h-3 w-3 opacity-60" />}
                      {room.isLegacy && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {t("chat.legacy.badge")}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </>
          )}

          {chatTab === "personal" &&
            !conversationsLoading &&
            !conversationsError &&
            visibleConversations.length === 0 && (
              <EmptyState
                variant="compact"
                className="py-4"
                title={
                  roomQuery.trim()
                    ? t("chat.page.empty.dialogsNotFound")
                    : t("chat.page.empty.noPersonal")
                }
                action={
                  !roomQuery.trim() ? (
                    <Link href="/friends">
                      <Button variant="outline" size="sm" className="rounded-full">
                        {t("chat.page.empty.findFriends")}
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            )}

          {chatTab === "unread" &&
            !conversationsLoading &&
            !roomsLoading &&
            visibleConversations.length === 0 &&
            filteredRooms.length === 0 && (
              <EmptyState
                variant="compact"
                className="py-4"
                title={t("chat.page.empty.noUnread")}
              />
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
