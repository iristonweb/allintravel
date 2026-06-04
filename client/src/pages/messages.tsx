import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import MessageContent from "@/components/chat/MessageContent";
import { Button } from "@/components/ui/button";
import MessageComposer from "@/components/chat/MessageComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { PrivateMessage, User } from "@shared/schema";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";

interface Conversation {
  user: User;
  lastMessage: PrivateMessage | null;
  unreadCount: number;
}

export function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [msgTab, setMsgTab] = useState<"all" | "personal" | "groups">("all");

  const withUserId =
    location === "/messages" && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("with")
      : null;

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

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

  const { data: messages = [] } = useQuery<PrivateMessage[]>({
    queryKey: ["/api/messages", selectedConversation?.user.id],
    enabled: !!selectedConversation?.user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { receiverId: string; content: string }) =>
      apiRequest("POST", "/api/messages", messageData),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
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
    const content = (contentOverride ?? newMessage).trim();
    if (!content || !selectedConversation) return;

    sendMessageMutation.mutate({
      receiverId: selectedConversation.user.id,
      content,
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
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
    <AppLayout fullWidth contentClassName="p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="ait-section-title">Сообщения</h1>
        <p className="text-muted-foreground mt-1 mb-4">Личные чаты и групповые поездки</p>

        <div className="flex gap-2 mb-6 ait-nav-pill rounded-full p-1 w-fit">
          {(
            [
              { id: "all", label: "Все" },
              { id: "personal", label: "Личные" },
              { id: "groups", label: "Группы" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMsgTab(t.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                msgTab === t.id ? "ait-nav-active text-white" : "text-slate-400 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] gap-4 h-[calc(100vh-200px)] min-h-[520px]">
            <div className="ait-chat-panel lg:col-span-1 overflow-hidden flex flex-col min-h-0">
              <div className="ait-chat-panel-header p-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-ait-purple" />
                  Чаты
                </h2>
              </div>
              <div className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-280px)]">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Нет сообщений</h3>
                      <p className="text-sm text-muted-foreground">
                        Начните общение с друзьями
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {conversations.map((conversation) => (
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
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.user.profileImageUrl ?? undefined} />
                              <AvatarFallback>
                                {getUserInitial(conversation.user)}
                              </AvatarFallback>
                            </Avatar>
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
                      <Avatar>
                        <AvatarImage src={selectedConversation.user.profileImageUrl ?? undefined} />
                        <AvatarFallback>
                          {getUserInitial(selectedConversation.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {getUserDisplayLabel(selectedConversation.user)}
                        </h3>
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
                      <div className="space-y-5">
                        {messages.map((message) => {
                          const isOwn = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}
                            >
                              {!isOwn && (
                                <Avatar className="h-8 w-8 shrink-0 border border-white/15">
                                  <AvatarImage
                                    src={selectedConversation.user.profileImageUrl ?? undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getUserInitial(selectedConversation.user)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <ChatMessageBubble
                                content={message.content}
                                isOwn={isOwn}
                                timestamp={
                                  <span
                                    className={cn(
                                      "text-[10px] px-1",
                                      isOwn ? "text-muted-foreground" : "text-muted-foreground",
                                    )}
                                  >
                                    {formatTime(message.createdAt as unknown as string)}
                                  </span>
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="ait-chat-panel-header p-4 mt-auto border-t">
                      <div className="flex gap-2 items-center">
                        <MessageComposer
                          value={newMessage}
                          onChange={setNewMessage}
                          onSend={handleSendMessage}
                          placeholder="Введите сообщение..."
                          disabled={sendMessageMutation.isPending}
                          className="flex-1"
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
