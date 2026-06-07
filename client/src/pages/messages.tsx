import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, Link, useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import { Button } from "@/components/ui/button";
import MessageComposer from "@/components/chat/MessageComposer";
import { AvatarWithPresence } from "@/components/PresenceDot";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import type { PrivateMessage, PrivateMessageWithMeta, User } from "@shared/schema";
import { messagePreview, encodeReplyBlock } from "@/lib/chat-message";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";

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
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const withUserId = useMemo(() => {
    if (location !== "/messages") return null;
    return new URLSearchParams(searchString).get("with");
  }, [location, searchString]);

  useEffect(() => {
    if (!isAuthenticated || location !== "/messages") return;
    const params = new URLSearchParams(searchString);
    const withId = params.get("with");
    if (withId) return;
    const tab = params.get("tab");
    if (tab === "unread") {
      setLocation("/chat?tab=unread");
      return;
    }
    if (tab === "groups") {
      setLocation("/chat");
      return;
    }
    setLocation("/chat?tab=personal");
  }, [isAuthenticated, location, searchString, setLocation]);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
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
          },
        );
      }
    } else if (
      !withUserId &&
      selectedConversation?.user &&
      !conversations.some((c) => c.user.id === selectedConversation.user.id)
    ) {
      setSelectedConversation(null);
    }
  }, [withUserId, userToOpen, user?.id, conversations, selectedConversation?.user]);

  const messagesKey = ["/api/messages", selectedConversation?.user.id] as const;

  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
  } = useQuery<PrivateMessageWithMeta[]>({
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
    onError: () => {
      toast({ title: "Не удалось изменить сообщение", variant: "destructive" });
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
    onError: () => {
      toast({ title: "Не удалось удалить сообщение", variant: "destructive" });
    },
  });

  const prevScrollConvRef = useRef<string | undefined>();
  const prevScrollLenRef = useRef(0);

  useEffect(() => {
    const convId = selectedConversation?.user.id;
    const len = messages.length;
    const convChanged = convId !== prevScrollConvRef.current;
    const grew = len > prevScrollLenRef.current;
    prevScrollConvRef.current = convId;
    prevScrollLenRef.current = len;
    if (convChanged || grew) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, selectedConversation?.user.id]);

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
      toast({ title: "Не удалось отправить сообщение", variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (senderId: string) => apiRequest("PUT", `/api/messages/read/${senderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const lastMarkedSenderRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (
      selectedConversation?.user &&
      selectedConversation.unreadCount > 0 &&
      lastMarkedSenderRef.current !== selectedConversation.user.id
    ) {
      lastMarkedSenderRef.current = selectedConversation.user.id;
      markAsReadMutation.mutate(selectedConversation.user.id);
    }
  }, [selectedConversation, markAsReadMutation]);

  if (!withUserId) {
    return (
      <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-2 md:p-4">
        <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">
            Чтобы отправлять сообщения, необходимо войти в систему
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!selectedConversation) {
    return (
      <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-2 md:p-4">
        <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-2 md:p-4">
      <div
        className="max-w-[1600px] mx-auto ait-chat-panel overflow-hidden flex flex-col min-h-0"
        style={{ height: "calc(100dvh - var(--ait-header-h, 5rem) - 1rem)" }}
      >
        <div className="ait-chat-panel-header p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild aria-label="Назад к чатам">
              <Link href="/chat?tab=personal">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <AvatarWithPresence
              src={selectedConversation.user.profileImageUrl}
              fallback={getUserInitial(selectedConversation.user)}
              isOnline={selectedConversation.user.isOnline}
              className="h-16 w-16"
            />
            <div>
              <h3 className="font-semibold">{getUserDisplayLabel(selectedConversation.user)}</h3>
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
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Загрузка сообщений…</p>
                </div>
              ) : messagesError ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-3">
                  <p className="text-sm">Не удалось загрузить сообщения</p>
                  <Button variant="outline" size="sm" onClick={() => refetchMessages()}>
                    Повторить
                  </Button>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  const peer = selectedConversation.user;
                  return (
                    <ChatMessageRow
                      key={message.id}
                      messageId={message.id}
                      content={message.content}
                      isOwn={isOwn}
                      senderInitial={
                        isOwn ? (user ? getUserInitial(user) : "Я") : getUserInitial(peer)
                      }
                      senderAvatarUrl={isOwn ? user?.profileImageUrl : peer.profileImageUrl}
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
                })
              )}
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
                aria-label="Отправить сообщение"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Messages;
