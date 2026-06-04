import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import { Button } from "@/components/ui/button";
import MessageComposer from "@/components/chat/MessageComposer";
import RoomSettingsPanel from "@/components/chat/RoomSettingsPanel";
import { getChatBackgroundClass } from "@/lib/chat-backgrounds";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Settings,
  Pin,
  Camera,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createChatRoom } from "@/lib/upload-media";
import RoomAvatar from "@/components/chat/RoomAvatar";
import type {
  ChatMessage,
  ChatRoom,
  MessageReactionMeta,
  MessageReadMeta,
  User,
} from "@shared/schema";
import { mergeChronologicalMessages } from "@/lib/chat-thread";
import { messagePreview, withReplyMention } from "@/lib/chat-message";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import type { UserLabelFields } from "@shared/user-display";
import { useToast } from "@/hooks/use-toast";

type ChatTab = "all" | "personal" | "mine";

type ReplyTarget = { username: string; label: string; preview: string };

type RoomListItem = ChatRoom & { memberCount: number; myRole: string | null };

type ChatMessageWithSender = ChatMessage &
  MessageReactionMeta &
  Partial<MessageReadMeta> & {
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
  const [roomQuery, setRoomQuery] = useState("");
  const [activeRoom, setActiveRoom] = useState("general");
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "private",
  });
  const [newRoomAvatarFile, setNewRoomAvatarFile] = useState<File | null>(null);
  const [newRoomAvatarPreview, setNewRoomAvatarPreview] = useState<string | null>(null);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
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
  }).filter((r) => {
    const q = roomQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false)
    );
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
  const listRoom = rooms.find((r) => r.slug === activeRoom);
  const historyRoom = Array.isArray(historyPayload) ? undefined : historyPayload?.room;
  const activeRoomMeta: RoomListItem | ChatRoom | undefined =
    listRoom && historyRoom
      ? { ...historyRoom, memberCount: listRoom.memberCount, myRole: listRoom.myRole }
      : listRoom ?? historyRoom;
  const pinnedIds = Array.isArray(historyPayload)
    ? []
    : (historyPayload?.pinnedMessageIds ?? []);

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const { room, avatarWarning } = await createChatRoom({
        title: newRoom.title,
        description: newRoom.description || undefined,
        visibility: newRoom.visibility,
        avatarFile: newRoomAvatarFile,
      });
      return { room, avatarWarning };
    },
    onSuccess: ({ room, avatarWarning }) => {
      if (avatarWarning) {
        toast({
          title: "Комната создана",
          description: avatarWarning,
          variant: "destructive",
        });
      } else {
        toast({ title: "Комната создана" });
      }
      setCreateOpen(false);
      setNewRoom({ title: "", description: "", visibility: "public" });
      if (newRoomAvatarPreview) URL.revokeObjectURL(newRoomAvatarPreview);
      setNewRoomAvatarFile(null);
      setNewRoomAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setActiveRoom(room.slug);
    },
    onError: (err) =>
      toast({
        title: "Не удалось создать",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      }),
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
      setReplyTo(null);
    },
    onError: (err) =>
      toast({
        title: "Не удалось отправить",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      }),
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

  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string | null }) => {
      if (!roomId) throw new Error("no room");
      const res = await apiRequest(
        "PUT",
        `/api/chat/rooms/${roomId}/messages/${messageId}/reactions`,
        { emoji },
      );
      return (await res.json()) as MessageReactionMeta;
    },
    onSuccess: (meta, { messageId }) => {
      queryClient.setQueryData<ChatHistoryPayload | ChatMessageWithSender[]>(
        historyKey,
        (old) => {
          const patch = (m: ChatMessageWithSender) =>
            m.id === messageId ? { ...m, ...meta } : m;
          if (Array.isArray(old)) return old.map(patch);
          if (!old?.messages) return old;
          return { ...old, messages: old.messages.map(patch) };
        },
      );
    },
  });

  const markRoomReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!roomId) return;
      await apiRequest("POST", `/api/chat/rooms/${roomId}/read`, { messageId });
    },
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
          const messageWithSender = { ...data.message, sender: data.sender ?? null, reactions: [] };
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
        } else if (
          (data.type === "reaction_updated" || data.type === "read_cursor_updated") &&
          data.roomId
        ) {
          queryClient.invalidateQueries({ queryKey: [`/api/chat/${activeRoom}`] });
        } else if (data.type === "error" && data.message) {
          toast({ title: "Ошибка чата", description: String(data.message), variant: "destructive" });
        }
      } catch {
        /* ignore */
      }
    };
  }, [isAuthenticated, user, useHttpMode, queryClient, activeRoom, toast]);

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

  useEffect(() => {
    if (!roomId || allMessages.length === 0) return;
    const last = [...allMessages].reverse().find((m) => m.id && !String(m.id).startsWith("temp-"));
    if (last?.id) markRoomReadMutation.mutate(last.id);
  }, [roomId, allMessages.length, activeRoom]);
  const pinnedMessages = allMessages.filter((m) => m.id && pinnedIds.includes(m.id));
  const threadMessages = allMessages.filter((m) => !m.id || !pinnedIds.includes(m.id));
  const myRole = (activeRoomMeta as RoomListItem | undefined)?.myRole;
  const isRoomAdmin =
    myRole === "admin" ||
    myRole === "owner" ||
    activeRoomMeta?.createdBy === user?.id;
  const chatBgClass = getChatBackgroundClass(activeRoomMeta?.settings?.chatBackground);
  const canSend = useHttpMode ? !postMessage.isPending : wsConnected;

  const handleSend = async (contentOverride?: string) => {
    let body = (contentOverride ?? messageText).trim();
    if (!body || !canSend) return;
    if (replyTo && !contentOverride?.includes("[") && !body.includes(`@${replyTo.username}`)) {
      body = withReplyMention(body, replyTo.username);
    }

    if (useHttpMode) {
      try {
        await postMessage.mutateAsync(body);
        setMessageText("");
      } catch {
        /* toast in onError */
      }
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
      reactions: [],
    };
    setWsMessages((prev) => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), optimistic],
    }));
    setMessageText("");
    setReplyTo(null);

    wsRef.current.send(
      JSON.stringify({
        type: "chat_message",
        userId: user?.id,
        content: body,
        chatRoom: activeRoom,
      }),
    );
  };

  const startReply = (msg: ChatMessageWithSender, label: string, username?: string | null) => {
    if (!username) {
      toast({
        title: "Нельзя ответить",
        description: "У автора нет @username в профиле",
        variant: "destructive",
      });
      return;
    }
    setReplyTo({ username, label, preview: messagePreview(msg.content) });
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
      <div className="max-w-[1600px] mx-auto px-3 py-4 md:py-6">
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
          className="grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_1fr] gap-3"
          style={{ height: "calc(100vh - 200px)", minHeight: "560px" }}
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
                          {newRoomAvatarPreview ? (
                            <img
                              src={newRoomAvatarPreview}
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
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (newRoomAvatarPreview) URL.revokeObjectURL(newRoomAvatarPreview);
                                setNewRoomAvatarFile(file);
                                setNewRoomAvatarPreview(URL.createObjectURL(file));
                                e.target.value = "";
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={createRoomMutation.isPending}
                              onClick={() => createAvatarInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Аватар
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
            {chatTab !== "personal" && (
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={roomQuery}
                    onChange={(e) => setRoomQuery(e.target.value)}
                    placeholder="Поиск комнат…"
                    className="h-8 pl-8 text-sm bg-background/50"
                  />
                </div>
              </div>
            )}
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
                ) : filteredRooms.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {roomQuery.trim() ? "Ничего не найдено" : "Нет комнат"}
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
                        <RoomAvatar title={room.title} avatarUrl={room.avatarUrl} />
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
              <RoomAvatar
                title={activeRoomMeta?.title ?? activeRoom}
                avatarUrl={activeRoomMeta?.avatarUrl}
                className="h-10 w-10"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{activeRoomMeta?.title ?? activeRoom}</h2>
                <p className="text-xs text-muted-foreground truncate">
                  {activeRoomMeta?.description ?? "Групповое обсуждение"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                title="Настройки комнаты"
                onClick={() => setShowRoomInfo(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <Sheet open={showRoomInfo} onOpenChange={setShowRoomInfo}>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
                <SheetHeader className="p-4 pb-0">
                  <SheetTitle>Настройки комнаты</SheetTitle>
                </SheetHeader>
                {activeRoomMeta && (
                  <RoomSettingsPanel
                    room={activeRoomMeta as RoomListItem}
                    currentUserId={user?.id}
                    onClose={() => setShowRoomInfo(false)}
                    onLeft={() => {
                      setShowRoomInfo(false);
                      setActiveRoom("general");
                    }}
                  />
                )}
              </SheetContent>
            </Sheet>

            <ScrollArea className={cn("flex-1 p-4", chatBgClass)}>
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
                            meta={{ reactions: msg.reactions ?? [] }}
                            deliveryStatus={msg.deliveryStatus}
                            canPin={isOwn || isRoomAdmin}
                            canDelete={isOwn || isRoomAdmin}
                            canEdit={isOwn}
                            onReact={
                              msg.id
                                ? (emoji) =>
                                    reactionMutation.mutate({ messageId: msg.id!, emoji })
                                : undefined
                            }
                            insightsUrl={
                              roomId && msg.id
                                ? `/api/chat/rooms/${roomId}/messages/${msg.id}/insights`
                                : undefined
                            }
                            onUnpin={() => pinMutation.mutate({ messageId: msg.id!, pin: false })}
                            onDelete={() => deleteMutation.mutate(msg.id!)}
                            onEdit={(c) => editMutation.mutate({ messageId: msg.id!, content: c })}
                            reacting={reactionMutation.isPending}
                            onReply={
                              !isOwn && msg.sender?.username
                                ? () =>
                                    startReply(
                                      msg,
                                      msg.sender ? getUserDisplayLabel(msg.sender) : "Пользователь",
                                      msg.sender?.username,
                                    )
                                : undefined
                            }
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
                        reacting={reactionMutation.isPending}
                        onReply={
                          !isOwn && msg.sender?.username
                            ? () => startReply(msg, senderName, msg.sender?.username)
                            : undefined
                        }
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
                  onSend={(content) => void handleSend(content)}
                  placeholder={canSend ? "Сообщение…" : "Подключение…"}
                  disabled={!canSend}
                  className="flex-1"
                  suggestUsers={mentionSuggestUsers}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
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
