import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import { Button } from "@/components/ui/button";
import MessageComposer from "@/components/chat/MessageComposer";
import RoomSettingsPanel from "@/components/chat/RoomSettingsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
import {
  Send,
  MessageCircle,
  Users,
  Hash,
  Plus,
  Lock,
  Globe,
  Info,
  Pin,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/upload-media";
import type { ChatMessage, ChatRoom, MessageReactionMeta, User } from "@shared/schema";
import { mergeChronologicalMessages } from "@/lib/chat-thread";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import type { UserLabelFields } from "@shared/user-display";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

type ChatTab = "all" | "personal" | "mine";

type RoomListItem = ChatRoom & { memberCount: number; myRole: string | null };

type ChatMessageWithSender = ChatMessage &
  MessageReactionMeta & {
    sender?: (UserLabelFields & { id?: string; profileImageUrl?: string | null }) | null;
  };

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

type ChatHistoryPayload = {
  messages?: ChatMessageWithSender[];
  pinnedMessageIds?: string[];
  room?: ChatRoom;
};

export function Chat() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();
  const [chatTab, setChatTab] = useState<ChatTab>("all");
  const [activeRoom, setActiveRoom] = useState("general");
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "private",
    avatarUrl: "" as string | undefined,
  });
  const [newRoomAvatarUploading, setNewRoomAvatarUploading] = useState(false);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState("");
  const [wsMessages, setWsMessages] = useState<Record<string, ChatMessageWithSender[]>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [useHttpMode, setUseHttpMode] = useState(isVercelHost);
  const wsRef = useRef<WebSocket | null>(null);
  const wsFailCount = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [] } = useQuery<RoomListItem[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const joinMatch = location.match(/^\/chat\/join\/([^/]+)/);
    if (joinMatch && isAuthenticated) {
      apiRequest("POST", `/api/chat/join/${joinMatch[1]}`)
        .then((r) => r.json())
        .then((room: ChatRoom) => {
          setActiveRoom(room.slug);
          queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
          toast({ title: `Вы вступили в «${room.title}»` });
        })
        .catch(() => toast({ title: "Не удалось вступить", variant: "destructive" }));
    }
  }, [location, isAuthenticated, queryClient, toast]);

  const filteredRooms = rooms.filter((r) => {
    if (chatTab === "mine") return r.myRole != null;
    if (chatTab === "personal") return false;
    return true;
  });

  const historyKey = [`/api/chat/${activeRoom}`] as const;

  const { data: historyPayload } = useQuery<ChatHistoryPayload | ChatMessageWithSender[]>({
    queryKey: historyKey,
    enabled: isAuthenticated,
    refetchInterval: useHttpMode ? 2000 : false,
  });

  const history: ChatMessageWithSender[] = Array.isArray(historyPayload)
    ? historyPayload
    : (historyPayload?.messages ?? []);
  const activeRoomMeta = Array.isArray(historyPayload)
    ? rooms.find((r) => r.slug === activeRoom)
    : historyPayload?.room ?? rooms.find((r) => r.slug === activeRoom);
  const pinnedIds = Array.isArray(historyPayload)
    ? []
    : (historyPayload?.pinnedMessageIds ?? []);

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: newRoom.title,
        description: newRoom.description || undefined,
        visibility: newRoom.visibility,
        ...(newRoom.avatarUrl ? { avatarUrl: newRoom.avatarUrl } : {}),
      };
      const res = await apiRequest("POST", "/api/chat/rooms", payload);
      return (await res.json()) as ChatRoom;
    },
    onSuccess: (room) => {
      toast({ title: "Комната создана" });
      setCreateOpen(false);
      setNewRoom({ title: "", description: "", visibility: "public", avatarUrl: undefined });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setActiveRoom(room.slug);
    },
    onError: () => toast({ title: "Не удалось создать", variant: "destructive" }),
  });

  const appendMessageToHistory = useCallback(
    (saved: ChatMessageWithSender) => {
      queryClient.setQueryData<ChatHistoryPayload | ChatMessageWithSender[]>(
        historyKey,
        (old) => {
          const messages = Array.isArray(old) ? old : (old?.messages ?? []);
          if (messages.some((m) => m.id === saved.id)) return old;
          const next = [...messages, saved];
          if (Array.isArray(old)) return next;
          return { ...old, messages: next };
        },
      );
    },
    [queryClient, historyKey],
  );

  const postMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/chat/${activeRoom}`, { content });
      return (await res.json()) as ChatMessageWithSender;
    },
    onSuccess: (saved) => {
      appendMessageToHistory(saved);
    },
  });

  const roomId = activeRoomMeta?.id;

  const { data: roomMembers = [] } = useQuery<
    { userId: string; user?: User | null }[]
  >({
    queryKey: [`/api/chat/rooms/${roomId}/members`],
    enabled: Boolean(roomId && isAuthenticated),
  });

  const mentionSuggestUsers = roomMembers
    .map((m) => m.user)
    .filter((u): u is User => Boolean(u?.username));

  const invalidateThread = () => {
    queryClient.invalidateQueries({ queryKey: historyKey });
    setWsMessages((prev) => ({ ...prev, [activeRoom]: [] }));
  };

  const likeMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!roomId) throw new Error("no room");
      const res = await apiRequest("POST", `/api/chat/rooms/${roomId}/messages/${messageId}/like`);
      return res.json();
    },
    onSuccess: invalidateThread,
  });

  const pinMutation = useMutation({
    mutationFn: async ({ messageId, pin }: { messageId: string; pin: boolean }) => {
      if (!roomId) throw new Error("no room");
      if (pin) {
        await apiRequest("POST", `/api/chat/rooms/${roomId}/messages/${messageId}/pin`);
      } else {
        await apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${messageId}/pin`);
      }
    },
    onSuccess: invalidateThread,
  });

  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!roomId) throw new Error("no room");
      const res = await apiRequest("PATCH", `/api/chat/rooms/${roomId}/messages/${messageId}`, {
        content,
      });
      return res.json();
    },
    onSuccess: invalidateThread,
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!roomId) throw new Error("no room");
      await apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${messageId}`);
    },
    onSuccess: invalidateThread,
  });

  const connect = useCallback(() => {
    if (!isAuthenticated || !user || useHttpMode) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      wsFailCount.current = 0;
    };

    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
      wsFailCount.current += 1;
      if (wsFailCount.current >= 2) {
        setUseHttpMode(true);
        return;
      }
      setTimeout(connect, 3000);
    };

    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && data.message) {
          const room: string = data.message.chatRoom;
          const messageWithSender = { ...data.message, sender: data.sender ?? null };
          setWsMessages((prev) => {
            const roomMsgs = prev[room] || [];
            const withoutTemp = roomMsgs.filter(
              (m) =>
                !(
                  String(m.id).startsWith("temp-") &&
                  m.userId === messageWithSender.userId &&
                  m.content === messageWithSender.content
                ),
            );
            if (withoutTemp.some((m) => m.id === messageWithSender.id)) return prev;
            return { ...prev, [room]: [...withoutTemp, messageWithSender] };
          });
        }
      } catch {
        /* ignore */
      }
    };
  }, [isAuthenticated, user, useHttpMode]);

  useEffect(() => {
    if (useHttpMode) return;
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, useHttpMode]);

  useEffect(() => {
    setWsMessages((prev) => ({ ...prev, [activeRoom]: [] }));
  }, [activeRoom]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, wsMessages, activeRoom]);

  const currentWsMessages = wsMessages[activeRoom] || [];
  const allMessages = mergeChronologicalMessages(history, currentWsMessages);
  const pinnedMessages = allMessages.filter((m) => m.id && pinnedIds.includes(m.id));
  const threadMessages = allMessages.filter((m) => !m.id || !pinnedIds.includes(m.id));
  const myRole = (activeRoomMeta as RoomListItem | undefined)?.myRole;
  const isRoomAdmin = myRole === "admin" || myRole === "owner";
  const canSend = useHttpMode ? !postMessage.isPending : wsConnected;

  const handleSend = async (contentOverride?: string) => {
    const body = (contentOverride ?? messageText).trim();
    if (!body || !canSend) return;

    if (useHttpMode) {
      await postMessage.mutateAsync(body);
      setMessageText("");
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }

    const optimistic: ChatMessageWithSender = {
      id: `temp-${Date.now()}`,
      userId: user!.id,
      content: body,
      chatRoom: activeRoom,
      createdAt: new Date(),
      updatedAt: null,
      sender: user
        ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            username: user.username,
            profileImageUrl: user.profileImageUrl,
          }
        : null,
      likeCount: 0,
      likedByMe: false,
    };
    setWsMessages((prev) => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), optimistic],
    }));
    setMessageText("");

    wsRef.current.send(
      JSON.stringify({
        type: "chat_message",
        userId: user?.id,
        content: body,
        chatRoom: activeRoom,
      }),
    );
  };

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <div className="text-center max-w-md mx-auto ait-glass rounded-3xl p-10">
          <MessageCircle className="h-12 w-12 mx-auto text-ait-purple mb-4" />
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы участвовать в чатах путешествий</p>
        </div>
      </AppLayout>
    );
  }

  const statusLabel = useHttpMode
    ? "HTTP · 4с"
    : wsConnected
      ? "Онлайн"
      : "Подключение…";

  return (
    <AppLayout fullWidth contentClassName="p-0 md:p-4">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="ait-section-title">Чаты</h1>
          <p className="text-muted-foreground mt-1">
            Открытые и закрытые комнаты — как супергруппы в Telegram
          </p>
        </motion.div>

        <ChatFilterTabs
          layoutId="chat-page-filter"
          tabs={[
            { id: "all", label: "Все" },
            { id: "personal", label: "Личные" },
            { id: "mine", label: "Мои" },
          ]}
          value={chatTab}
          onChange={setChatTab}
          className="mb-4"
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4"
          style={{ height: "calc(100vh - 220px)", minHeight: "520px" }}
        >
          <div className="ait-chat-panel flex flex-col min-h-0">
            <div className="ait-chat-panel-header p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-ait-purple" />
                  Комнаты
                </span>
                <div className="flex items-center gap-1">
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Создать комнату</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          {newRoom.avatarUrl ? (
                            <img
                              src={resolveMediaUrl(newRoom.avatarUrl)}
                              alt=""
                              className="h-14 w-14 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                              {newRoom.title.slice(0, 1).toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <input
                              ref={createAvatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setNewRoomAvatarUploading(true);
                                void uploadMediaFile(file)
                                  .then((url) => setNewRoom((r) => ({ ...r, avatarUrl: url })))
                                  .catch(() =>
                                    toast({ title: "Не удалось загрузить аватар", variant: "destructive" }),
                                  )
                                  .finally(() => setNewRoomAvatarUploading(false));
                                e.target.value = "";
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={newRoomAvatarUploading}
                              onClick={() => createAvatarInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              {newRoomAvatarUploading ? "Загрузка…" : "Аватар"}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Название</Label>
                          <Input
                            value={newRoom.title}
                            onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Описание</Label>
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
                            Открытая
                          </Button>
                          <Button
                            type="button"
                            variant={newRoom.visibility === "private" ? "default" : "outline"}
                            onClick={() => setNewRoom({ ...newRoom, visibility: "private" })}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Закрытая
                          </Button>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => createRoomMutation.mutate()}
                          disabled={!newRoom.title.trim() || createRoomMutation.isPending}
                        >
                          Создать
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Badge variant="secondary" className="text-[10px] ait-glass">
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {chatTab === "personal" ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Личные чаты — в разделе{" "}
                    <a href="/messages" className="text-ait-purple hover:underline">
                      Сообщения
                    </a>
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setActiveRoom(room.slug)}
                        className={cn(
                          "ait-chat-room-item w-full text-left",
                          activeRoom === room.slug
                            ? "ait-chat-room-item--active"
                            : "text-slate-400",
                        )}
                      >
                        {room.avatarUrl ? (
                          <img
                            src={resolveMediaUrl(room.avatarUrl)}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <Hash className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1 truncate">{room.title}</span>
                        {room.visibility === "private" && <Lock className="h-3 w-3 shrink-0 opacity-60" />}
                        {room.isLegacy && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            Офиц.
                          </Badge>
                        )}
                      </button>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="ait-chat-panel flex flex-col overflow-hidden min-h-0">
            <div className="ait-chat-panel-header p-4 flex items-center gap-3">
              {activeRoomMeta?.avatarUrl ? (
                <img
                  src={resolveMediaUrl(activeRoomMeta.avatarUrl)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <Hash className="h-5 w-5 text-ait-orange" />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{activeRoomMeta?.title ?? activeRoom}</h2>
                <p className="text-xs text-muted-foreground truncate">
                  {activeRoomMeta?.description ?? "Групповое обсуждение"}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowRoomInfo((v) => !v)}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            {showRoomInfo && activeRoomMeta && (
              <RoomSettingsPanel
                room={activeRoomMeta as RoomListItem}
                currentUserId={user?.id}
                onClose={() => setShowRoomInfo(false)}
                onLeft={() => setActiveRoom("general")}
              />
            )}

            <ScrollArea className="flex-1 p-4 ait-chat-thread">
              {allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Начните разговор о следующей поездке</p>
                </div>
              ) : (
                <div className="ait-chat-thread-inner space-y-4">
                  {pinnedMessages.length > 0 && (
                    <div className="mb-2 p-3 rounded-xl border border-ait-orange/25 bg-ait-orange/5 space-y-3">
                      <p className="text-xs font-semibold text-ait-orange flex items-center gap-1.5">
                        <Pin className="h-3.5 w-3.5" />
                        Закреплённые
                      </p>
                      {pinnedMessages.map((msg) => {
                        const isOwn = msg.userId === user?.id;
                        return (
                          <ChatMessageRow
                            key={`pin-${msg.id}`}
                            messageId={msg.id!}
                            content={msg.content}
                            isOwn={isOwn}
                            isPinned
                            createdAt={msg.createdAt}
                            updatedAt={msg.updatedAt}
                            meta={{ likeCount: msg.likeCount ?? 0, likedByMe: msg.likedByMe ?? false }}
                            canPin={isOwn || isRoomAdmin}
                            canDelete={isOwn || isRoomAdmin}
                            canEdit={isOwn}
                            onLike={() => likeMutation.mutate(msg.id!)}
                            onUnpin={() => pinMutation.mutate({ messageId: msg.id!, pin: false })}
                            onDelete={() => deleteMutation.mutate(msg.id!)}
                            onEdit={(c) => editMutation.mutate({ messageId: msg.id!, content: c })}
                            liking={likeMutation.isPending}
                          />
                        );
                      })}
                    </div>
                  )}
                  {threadMessages.map((msg) => {
                    const isOwn = msg.userId === user?.id;
                    const senderName = isOwn
                      ? (user ? getUserDisplayLabel(user) : "Я")
                      : msg.sender
                        ? getUserDisplayLabel(msg.sender)
                        : "Путешественник";
                    const senderInitial = isOwn
                      ? (user ? getUserInitial(user) : "Я")
                      : msg.sender
                        ? getUserInitial(msg.sender)
                        : "?";

                    return (
                      <ChatMessageRow
                        key={msg.id || `msg-${msg.content.slice(0, 8)}`}
                        messageId={msg.id ?? `tmp-${msg.createdAt}`}
                        content={msg.content}
                        isOwn={isOwn}
                        senderLabel={!isOwn ? senderName : undefined}
                        senderInitial={senderInitial}
                        createdAt={msg.createdAt}
                        updatedAt={msg.updatedAt}
                        meta={{ likeCount: msg.likeCount ?? 0, likedByMe: msg.likedByMe ?? false }}
                        canPin={Boolean(roomId && (isOwn || isRoomAdmin))}
                        canDelete={isOwn || isRoomAdmin}
                        canEdit={isOwn}
                        onLike={msg.id ? () => likeMutation.mutate(msg.id!) : undefined}
                        onPin={
                          msg.id && roomId
                            ? () => pinMutation.mutate({ messageId: msg.id!, pin: true })
                            : undefined
                        }
                        onDelete={msg.id ? () => deleteMutation.mutate(msg.id!) : undefined}
                        onEdit={
                          msg.id
                            ? (c) => editMutation.mutate({ messageId: msg.id!, content: c })
                            : undefined
                        }
                        liking={likeMutation.isPending}
                      />
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            <div className="ait-chat-panel-header p-4 border-t">
              <div className="flex gap-2 items-center">
                <MessageComposer
                  value={messageText}
                  onChange={setMessageText}
                  onSend={handleSend}
                  placeholder={canSend ? "Сообщение…" : "Подключение…"}
                  disabled={!canSend}
                  className="flex-1"
                  suggestUsers={mentionSuggestUsers}
                />
                <Button
                  variant="premium"
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={!messageText.trim() || !canSend}
                  className="rounded-2xl shrink-0 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Chat;
