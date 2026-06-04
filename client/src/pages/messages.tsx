import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";
import AppLayout from "@/components/app-layout";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import MessageContent from "@/components/chat/MessageContent";
import { Button } from "@/components/ui/button";
import MessageComposer from "@/components/chat/MessageComposer";
import { AvatarWithPresence } from "@/components/PresenceDot";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ChatRoom, PrivateMessage, PrivateMessageWithMeta, User } from "@shared/schema";
import { messagePreview, encodeReplyBlock } from "@/lib/chat-message";
import { useToast } from "@/hooks/use-toast";
import { Hash } from "lucide-react";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import RoomAvatar from "@/components/chat/RoomAvatar";

type RoomListItem = ChatRoom & { memberCount: number; myRole: string | null; unreadCount: number };

interface Conversation {
  user: User & { isOnline?: boolean };
  lastMessage: PrivateMessage | null;
  unreadCount: number;
}

type ReplyTarget = { username: string; label: string; preview: string };

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

export function Messages() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [msgTab, setMsgTab] = useState<"all" | "unread" | "groups">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const withUserId =
    location === "/messages" && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("with")
      : null;

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const { data: chatRooms = [], isLoading: roomsLoading } = useQuery<RoomListItem[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: isAuthenticated,
  });

  const myRooms = chatRooms.filter((r) => r.myRole != null);

  const { data: userToOpen } = useQuery<User | null>({
    queryKey: ["/api/users", withUserId || ""],
    enabled: !!withUserId && withUserId !== user?.id,
  });

  useEffect(() => {
    if (withUserId && withUserId !== user?.id) {
      if (userToOpen) {
        const existing = conversations.find((c) => c.user.id === userToOpen.id);
        setSelectedConversation(
          existing ?? {
            user: userToOpen,
            lastMessage: null,
            unreadCount: 0,
          }
        );
      }
    } else if (!withUserId && selectedConversation?.user && !conversations.some((c) => c.user.id === selectedConversation.user.id)) {
      setSelectedConversation(null);
    }
  }, [withUserId, userToOpen, user?.id, conversations]);

  const messagesKey = ["/api/messages", selectedConversation?.user.id] as const;

  const { data: messages = [] } = useQuery<PrivateMessageWithMeta[]>({
    queryKey: messagesKey,
    enabled: !!selectedConversation?.user?.id,
    refetchInterval: isVercelHost && !!selectedConversation?.user?.id ? 3000 : false,
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string | null }) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/reactions`, { emoji });
      return (await res.json()) as { reactions: PrivateMessageWithMeta["reactions"] };
    },
    onSuccess: (meta, { messageId }) => {
      queryClient.setQueryData<PrivateMessageWithMeta[]>(messagesKey, (old) =>
        (old ?? []).map((m) =>
          m.id === messageId ? { ...m, reactions: meta.reactions ?? [] } : m,
        ),
      );
    },
    onError: (err) => {
      toast({
        title: "Не удалось поставить реакцию",
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/messages/${messageId}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation?.user.id]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string }) => {
      return apiRequestJson<PrivateMessageWithMeta>("POST", "/api/messages", messageData);
    },
    onMutate: async (messageData) => {
      const key = ["/api/messages", messageData.receiverId] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PrivateMessageWithMeta[]>(key) ?? [];
      const optimistic: PrivateMessageWithMeta = {
        id: `temp-${Date.now()}`,
        senderId: user!.id,
        receiverId: messageData.receiverId,
        content: messageData.content,
        isRead: false,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: null,
        reactions: [],
      };
      queryClient.setQueryData(key, [...previous, optimistic]);
      setNewMessage("");
      return { previous, key, content: messageData.content };
    },
    onSuccess: (saved, _vars, context) => {
      if (!context) return;
      const current = queryClient.getQueryData<PrivateMessageWithMeta[]>(context.key) ?? [];
      const withoutTemp = current.filter((m) => !String(m.id).startsWith("temp-"));
      queryClient.setQueryData(context.key, [...withoutTemp, saved]);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setReplyTo(null);
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.previous);
        setNewMessage(context.content);
      }
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (senderId: string) =>
      apiRequest("PUT", `/api/messages/read/${senderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleSendMessage = (contentOverride?: string) => {
    let content = (contentOverride ?? newMessage).trim();
    if (!content || !selectedConversation) return;
    if (replyTo && !contentOverride?.includes("[reply:")) {
      content = encodeReplyBlock(replyTo.username, replyTo.preview, content);
    }

    sendMessageMutation.mutate({
      receiverId: selectedConversation.user.id,
      content,
    });
  };

  const startReply = (message: PrivateMessageWithMeta) => {
    const partner = selectedConversation?.user;
    if (!partner?.username) {
      toast({
        title: "Нельзя ответить",
        description: "У собеседника нет @username в профиле",
        variant: "destructive",
      });
      return;
    }
    setReplyTo({
      username: partner.username,
      label: getUserDisplayLabel(partner),
      preview: messagePreview(message.content),
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setReplyTo(null);
    if (conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversation.user.id);
    }
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ru });
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMM", { locale: ru });
  };

  const visibleConversations =
    msgTab === "groups"
      ? []
      : msgTab === "unread"
        ? conversations.filter((c) => c.unreadCount > 0)
        : conversations;

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы отправлять сообщения, необходимо войти в систему</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-2 md:p-4">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="ait-section-title">Сообщения</h1>
        <p className="text-muted-foreground mt-1 mb-4">Личные чаты и групповые поездки</p>

        <ChatFilterTabs
          layoutId="messages-page-filter"
          tabs={[
            { id: "all", label: "Все" },
            { id: "unread", label: "Непрочит." },
            { id: "groups", label: "Комнаты" },
          ]}
          value={msgTab}
          onChange={setMsgTab}
          className="mb-6"
        />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_1fr] gap-3 h-[calc(100dvh-var(--ait-header-h,5rem))] min-h-[560px]">
            <div className="ait-chat-panel lg:col-span-1 overflow-hidden flex flex-col min-h-0">
              <div className="ait-chat-panel-header p-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-ait-purple" />
                  Чаты
                </h2>
              </div>
              <div className="p-0">
                <ScrollArea className="h-[calc(100dvh-var(--ait-header-h,5rem)-8rem)] md:h-[calc(100dvh-var(--ait-header-h,5rem)-6rem)]">
                  {msgTab === "groups" ? (
                    roomsLoading ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">Загрузка…</div>
                    ) : myRooms.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground space-y-2">
                        <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Вы ещё не состоите в групповых чатах</p>
                        <Link href="/chat">
                          <Button variant="outline" size="sm" className="rounded-full">
                            Открыть комнаты
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="py-2">
                        {myRooms.map((room) => (
                          <Link key={room.id} href={`/chat?room=${room.slug}`}>
                            <div className="ait-chat-list-item cursor-pointer">
                              <div className="flex items-center gap-3">
                                <RoomAvatar title={room.title} avatarUrl={room.avatarUrl} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{room.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {room.memberCount} участн.
                                  </p>
                                </div>
                                {(room.unreadCount ?? 0) > 0 && (
                                  <Badge className="shrink-0 bg-ait-orange border-0 text-[10px] min-w-[1.25rem] justify-center">
                                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  ) : visibleConversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">
                        {msgTab === "unread" ? "Нет непрочитанных" : "Нет сообщений"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {msgTab === "unread"
                          ? "Все диалоги прочитаны"
                          : "Начните общение с друзьями"}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {visibleConversations.map((conversation) => (
                        <div
                          key={conversation.user.id}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "ait-chat-list-item cursor-pointer",
                            selectedConversation?.user.id === conversation.user.id &&
                              "ait-chat-list-item--active",
                          )}
                          onClick={() => handleSelectConversation(conversation)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSelectConversation(conversation);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <AvatarWithPresence
                              src={conversation.user.profileImageUrl}
                              fallback={getUserInitial(conversation.user)}
                              isOnline={conversation.user.isOnline}
                              className="h-14 w-14"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">
                                  {getUserDisplayLabel(conversation.user)}
                                </h4>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {conversation.lastMessage
                                    ? formatTime(conversation.lastMessage.createdAt as unknown as string)
                                    : ""}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage?.content ? (
                                  <MessageContent content={conversation.lastMessage.content} compact />
                                ) : (
                                  "Нет сообщений"
                                )}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge className="mt-1 bg-ait-orange border-0">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="ait-chat-panel overflow-hidden flex flex-col min-h-0">
              {selectedConversation ? (
                <>
                  <div className="ait-chat-panel-header p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <AvatarWithPresence
                        src={selectedConversation.user.profileImageUrl}
                        fallback={getUserInitial(selectedConversation.user)}
                        isOnline={selectedConversation.user.isOnline}
                        className="h-16 w-16"
                      />
                      <div>
                        <h3 className="font-semibold">
                          {getUserDisplayLabel(selectedConversation.user)}
                        </h3>
                        {selectedConversation.user.isOnline !== undefined && (
                          <p className="text-xs mt-0.5">
                            {selectedConversation.user.isOnline ? (
                              <span className="text-green-500">В сети</span>
                            ) : (
                              <span className="text-muted-foreground">Не в сети</span>
                            )}
                          </p>
                        )}
                        {getUserHandle(selectedConversation.user) && (
                          <p className="text-sm text-ait-purple">
                            {getUserHandle(selectedConversation.user)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-h-0">
                    <ScrollArea className="flex-1 p-4 md:p-6 ait-chat-thread">
                      <div className="ait-chat-thread-inner space-y-5">
                        {messages.map((message) => {
                          const isOwn = message.senderId === user?.id;
                          const peer = selectedConversation.user;
                          return (
                            <ChatMessageRow
                              key={message.id}
                              messageId={message.id}
                              content={message.content}
                              isOwn={isOwn}
                              senderInitial={
                                isOwn
                                  ? (user ? getUserInitial(user) : "Я")
                                  : getUserInitial(peer)
                              }
                              senderAvatarUrl={
                                isOwn ? user?.profileImageUrl : peer.profileImageUrl
                              }
                              createdAt={message.createdAt}
                              updatedAt={message.updatedAt}
                              meta={{ reactions: message.reactions ?? [] }}
                              deliveryStatus={isOwn ? message.deliveryStatus : undefined}
                              canEdit={isOwn}
                              canDelete={isOwn}
                              onReact={(emoji) =>
                                reactionMutation.mutate({ messageId: message.id, emoji })
                              }
                              insightsUrl={`/api/messages/${message.id}/insights`}
                              onEdit={(c) => editMutation.mutate({ messageId: message.id, content: c })}
                              onDelete={() => deleteMutation.mutate(message.id)}
                              reacting={
                                reactionMutation.isPending &&
                                reactionMutation.variables?.messageId === message.id
                              }
                              onReply={!isOwn ? () => startReply(message) : undefined}
                            />
                          );
                        })}
                        <div ref={scrollRef} />
                      </div>
                    </ScrollArea>

                    <div className="ait-chat-panel-header p-4 mt-auto border-t">
                      <div className="flex gap-2 items-center">
                        <MessageComposer
                          value={newMessage}
                          onChange={setNewMessage}
                          onSend={(content) => handleSendMessage(content)}
                          placeholder="Введите сообщение..."
                          disabled={sendMessageMutation.isPending}
                          className="flex-1"
                          replyTo={replyTo}
                          onCancelReply={() => setReplyTo(null)}
                        />
                        <Button
                          variant="premium"
                          size="icon"
                          onClick={() => handleSendMessage()}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          className="rounded-2xl shrink-0 shadow-lg"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 min-h-[320px] p-8 ait-chat-thread">
                  <div className="text-center ait-glass-ios rounded-3xl px-10 py-8 max-w-sm">
                    <MessageCircle className="mx-auto h-12 w-12 text-ait-purple mb-4 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">Выберите диалог</h3>
                    <p className="text-muted-foreground text-sm">
                      Выберите чат слева, чтобы начать переписку
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </AppLayout>
  );
}

export default Messages;
