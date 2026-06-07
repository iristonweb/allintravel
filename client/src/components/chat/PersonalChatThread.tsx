import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import MessageComposer from "@/components/chat/MessageComposer";
import { AvatarWithPresence } from "@/components/PresenceDot";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import type { PrivateMessage, PrivateMessageWithMeta, User } from "@shared/schema";
import { messagePreview, encodeReplyBlock } from "@/lib/chat-message";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { useTranslation } from "react-i18next";

type ReplyTarget = { username: string; label: string; preview: string };

interface Conversation {
  user: User & { isOnline?: boolean };
  lastMessage: PrivateMessage | null;
  unreadCount: number;
}

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

type PersonalChatThreadProps = {
  peerUserId: string;
  onBack?: () => void;
};

export default function PersonalChatThread({ peerUserId, onBack }: PersonalChatThreadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMarkedSenderRef = useRef<string | null>(null);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const {
    data: peerUser,
    isLoading: userLoading,
    isError: userError,
  } = useQuery<User | null>({
    queryKey: ["/api/users", peerUserId],
    enabled: Boolean(peerUserId) && peerUserId !== user?.id,
  });

  const peer: (User & { isOnline?: boolean }) | null =
    conversations.find((c) => c.user.id === peerUserId)?.user ??
    (peerUser ? { ...peerUser, isOnline: undefined } : null);

  const messagesKey = ["/api/messages", peerUserId] as const;

  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
  } = useQuery<PrivateMessageWithMeta[]>({
    queryKey: messagesKey,
    enabled: Boolean(peerUserId),
    refetchInterval: isVercelHost ? 3000 : false,
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
        title: t("chat.page.errors.reaction"),
        description: err instanceof Error ? err.message : t("chat.page.errors.retry"),
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
      toast({ title: t("chat.page.errors.edit"), variant: "destructive" });
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
      toast({ title: t("chat.page.errors.delete"), variant: "destructive" });
    },
  });

  const prevScrollLenRef = useRef(0);

  useEffect(() => {
    const len = messages.length;
    const grew = len > prevScrollLenRef.current;
    prevScrollLenRef.current = len;
    if (grew) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, peerUserId]);

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
      toast({ title: t("chat.personal.sendError"), variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (senderId: string) => apiRequest("PUT", `/api/messages/read/${senderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    if (!peerUserId) return;
    const fresh = conversations.find((c) => c.user.id === peerUserId);
    const unread = fresh?.unreadCount ?? 0;
    if (unread > 0 && lastMarkedSenderRef.current !== peerUserId) {
      lastMarkedSenderRef.current = peerUserId;
      markAsReadMutation.mutate(peerUserId);
    }
  }, [peerUserId, conversations, markAsReadMutation]);

  const handleSendMessage = (contentOverride?: string) => {
    let content = (contentOverride ?? newMessage).trim();
    if (!content || !peer) return;
    if (replyTo && !contentOverride?.includes("[reply:")) {
      content = encodeReplyBlock(replyTo.username, replyTo.preview, content);
    }
    sendMessageMutation.mutate({ receiverId: peer.id, content });
  };

  const startReply = (message: PrivateMessageWithMeta) => {
    if (!peer?.username) {
      toast({
        title: t("chat.page.errors.reply"),
        description: t("chat.personal.replyNoUsername"),
        variant: "destructive",
      });
      return;
    }
    setReplyTo({
      username: peer.username,
      label: getUserDisplayLabel(peer),
      preview: messagePreview(message.content),
    });
  };

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (userError || !peer) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground text-sm">
        {t("chat.personal.userNotFound")}
      </div>
    );
  }

  return (
    <>
      <div className="ait-chat-panel-header p-4 flex items-center gap-3 border-b border-white/5">
        {onBack && (
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
        <AvatarWithPresence
          src={peer.profileImageUrl}
          fallback={getUserInitial(peer)}
          isOnline={peer.isOnline}
          className="h-16 w-16"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{getUserDisplayLabel(peer)}</h2>
          {peer.isOnline !== undefined && (
            <p className="text-xs mt-0.5">
              {peer.isOnline ? (
                <span className="text-green-500">{t("chat.personal.online")}</span>
              ) : (
                <span className="text-muted-foreground">{t("chat.personal.offline")}</span>
              )}
            </p>
          )}
          {getUserHandle(peer) && (
            <p className="text-sm text-ait-purple truncate">{getUserHandle(peer)}</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 ait-chat-thread">
        <div className="ait-chat-thread-inner space-y-5 p-4 md:p-6">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">{t("chat.page.loading.messages")}</p>
            </div>
          ) : messagesError ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-3">
                  <p className="text-sm">{t("chat.page.errors.messages")}</p>
                  <Button variant="outline" size="sm" onClick={() => refetchMessages()}>
                    {t("chat.page.errors.retry")}
                  </Button>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <ChatMessageRow
                  key={message.id}
                  messageId={message.id}
                  content={message.content}
                  isOwn={isOwn}
                  senderInitial={isOwn ? (user ? getUserInitial(user) : "Я") : getUserInitial(peer)}
                  senderAvatarUrl={isOwn ? user?.profileImageUrl : peer.profileImageUrl}
                  createdAt={message.createdAt}
                  updatedAt={message.updatedAt}
                  meta={{ reactions: message.reactions ?? [] }}
                  deliveryStatus={isOwn ? message.deliveryStatus : undefined}
                  canEdit={isOwn}
                  canDelete={isOwn}
                  onReact={(emoji) => reactionMutation.mutate({ messageId: message.id, emoji })}
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

      <div className="ait-chat-panel-header p-4 border-t border-white/5">
        <div className="flex gap-2 items-center">
          <MessageComposer
            value={newMessage}
            onChange={setNewMessage}
            onSend={(content) => handleSendMessage(content)}
            placeholder={t("chat.personal.messagePlaceholder")}
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
            aria-label={t("chat.page.sendMessage")}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
