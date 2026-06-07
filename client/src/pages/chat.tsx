import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import ChatMessageRow from "@/components/chat/ChatMessageRow";
import { Button } from "@/components/ui/button";
import MessageComposer from "@/components/chat/MessageComposer";
import RoomSettingsPanel from "@/components/chat/RoomSettingsPanel";
import { getChatBackgroundClass } from "@/lib/chat-backgrounds";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  Hash,
  Plus,
  Lock,
  Globe,
  Settings,
  Pin,
  Camera,
  Search,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createChatRoom } from "@/lib/upload-media";
import RoomAvatar from "@/components/chat/RoomAvatar";
import type {
  ChatMessage,
  ChatRoom,
  MessageReactionMeta,
  MessageReadMeta,
  Trip,
  User,
} from "@shared/schema";
import AppBreadcrumbs from "@/components/layout/app-breadcrumbs";
import { mergeChronologicalMessages } from "@/lib/chat-thread";
import { messagePreview, encodeReplyBlock } from "@/lib/chat-message";
import MessageContent from "@/components/chat/MessageContent";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import type { UserLabelFields } from "@shared/user-display";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslation } from "react-i18next";

type ChatTab = "all" | "mine" | "unread";

type ReplyTarget = { username: string; label: string; preview: string };

type RoomListItem = ChatRoom & { memberCount: number; myRole: string | null; unreadCount: number };

type ChatMessageWithSender = ChatMessage &
  MessageReactionMeta &
  Partial<MessageReadMeta> & {
    sender?: (UserLabelFields & { id?: string; profileImageUrl?: string | null }) | null;
  };

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DiscoverRoom = ChatRoom & { memberCount: number; matchScore: number };

type ChatHistoryPayload = {
  messages?: ChatMessageWithSender[];
  pinnedMessageIds?: string[];
  room?: ChatRoom;
  joinRequired?: boolean;
  joinPreview?: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    avatarUrl?: string | null;
    memberCount?: number;
  };
};

async function fetchChatHistory(room: string): Promise<ChatHistoryPayload> {
  const res = await fetch(`/api/chat/${encodeURIComponent(room)}`, { credentials: "include" });
  const body = (await res.json()) as Record<string, unknown>;
  if (res.status === 403 && body.joinRequired && body.room) {
    return {
      joinRequired: true,
      joinPreview: body.room as NonNullable<ChatHistoryPayload["joinPreview"]>,
      messages: [],
      pinnedMessageIds: [],
    };
  }
  if (!res.ok) throw new Error(String(body.message ?? "Failed to load chat"));
  return body as ChatHistoryPayload;
}

export function Chat() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();
  const searchString = useSearch();
  const [chatTab, setChatTab] = useState<ChatTab>("all");
  const urlDiscoverQ = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("q")?.trim() ?? "";
  }, [searchString]);
  const [roomQuery, setRoomQuery] = useState(urlDiscoverQ);

  useEffect(() => {
    if (urlDiscoverQ) setRoomQuery(urlDiscoverQ);
  }, [urlDiscoverQ]);
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
  const pendingScrollMessageId = useRef<string | null>(null);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ait-message-highlight");
    window.setTimeout(() => el.classList.remove("ait-message-highlight"), 2000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const room = params.get("room");
    const message = params.get("message");
    if (room) setActiveRoom(room);
    if (message) pendingScrollMessageId.current = message;
  }, [searchString]);

  const {
    data: rooms = [],
    isLoading: roomsLoading,
    isError: roomsError,
    refetch: refetchRooms,
  } = useQuery<RoomListItem[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: isAuthenticated,
  });

  const discoverSearch = roomQuery.trim();
  const { data: discoverRooms = [], isFetching: discoverLoading } = useQuery<DiscoverRoom[]>({
    queryKey: ["/api/chat/rooms/discover", discoverSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ q: discoverSearch, limit: "12" });
      const res = await fetch(`/api/chat/rooms/discover?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to discover rooms");
      return res.json() as Promise<DiscoverRoom[]>;
    },
    enabled: isAuthenticated && discoverSearch.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    const joinMatch = location.match(/^\/chat\/join\/([^/]+)/);
    if (joinMatch && isAuthenticated) {
      apiRequest("POST", `/api/chat/join/${joinMatch[1]}`)
        .then((r) => r.json())
        .then((room: ChatRoom) => {
          setActiveRoom(room.slug);
          queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
          toast({ title: t("chat.joinGate.joinedToast", { title: room.title }) });
        })
        .catch(() => toast({ title: t("chat.joinGate.joinError"), variant: "destructive" }));
    }
  }, [location, isAuthenticated, queryClient, toast, t]);

  const filteredRooms = rooms
    .filter((r) => {
      if (chatTab === "mine") return r.myRole != null;
      if (chatTab === "unread") return (r.unreadCount ?? 0) > 0;
      return true;
    })
    .filter((r) => {
      const q = roomQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q) ?? false)
      );
    });

  const historyKey = useMemo(() => [`/api/chat/${activeRoom}`] as const, [activeRoom]);

  const {
    data: historyPayload,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery<ChatHistoryPayload | ChatMessageWithSender[]>({
    queryKey: historyKey,
    queryFn: () => fetchChatHistory(activeRoom),
    enabled: isAuthenticated && Boolean(activeRoom),
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
      : (listRoom ?? historyRoom);
  const pinnedIds = Array.isArray(historyPayload) ? [] : (historyPayload?.pinnedMessageIds ?? []);

  const joinRequired = !Array.isArray(historyPayload) && historyPayload?.joinRequired;
  const joinPreview = !Array.isArray(historyPayload) ? historyPayload?.joinPreview : undefined;

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      await apiRequest("POST", `/api/chat/rooms/${roomId}/join`);
      return roomId;
    },
    onSuccess: async (roomId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms/discover"] }),
        queryClient.refetchQueries({ queryKey: historyKey }),
      ]);
      const refreshed = queryClient.getQueryData<ChatHistoryPayload | ChatMessageWithSender[]>(
        historyKey,
      );
      const roomTitle =
        (!Array.isArray(refreshed) && refreshed?.room?.title) ||
        (joinPreview?.id === roomId ? joinPreview.title : undefined) ||
        rooms.find((r) => r.id === roomId)?.title ||
        discoverRooms.find((r) => r.id === roomId)?.title;
      if (roomTitle) {
        toast({ title: t("chat.joinGate.joinedToast", { title: roomTitle }) });
      } else {
        toast({ title: t("chat.joinGate.joinedToastFallback") });
      }
      setRoomQuery("");
    },
    onError: () => {
      toast({ title: t("chat.joinGate.joinErrorGroup"), variant: "destructive" });
    },
  });

  const fromHref = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("from");
  }, [searchString]);

  const effectiveTripId = useMemo(() => {
    if (fromHref) {
      const match = fromHref.match(/^\/trips\/([^/?#]+)/);
      if (match) return match[1];
    }
    return activeRoomMeta?.settings?.tripId ?? null;
  }, [fromHref, activeRoomMeta?.settings?.tripId]);

  const { data: breadcrumbTrip } = useQuery<Trip>({
    queryKey: ["/api/trips", effectiveTripId],
    enabled: !!effectiveTripId,
  });

  const roomBreadcrumbs = useMemo(() => {
    if (!effectiveTripId || !breadcrumbTrip) return null;
    return [
      { label: "Поездки", href: "/trips" },
      { label: breadcrumbTrip.title, href: `/trips/${effectiveTripId}` },
      { label: "Чат" },
    ];
  }, [effectiveTripId, breadcrumbTrip]);

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
          title: "Группа создана",
          description: avatarWarning,
          variant: "destructive",
        });
      } else {
        toast({ title: "Группа создана" });
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
      queryClient.setQueryData<ChatHistoryPayload | ChatMessageWithSender[]>(historyKey, (old) => {
        const messages = Array.isArray(old) ? old : (old?.messages ?? []);
        if (messages.some((m) => m.id === saved.id)) return old;
        const next = [...messages, saved];
        if (Array.isArray(old)) return next;
        return { ...old, messages: next };
      });
    },
    [queryClient, historyKey],
  );

  const postMessage = useMutation({
    mutationFn: async (content: string) => {
      return apiRequestJson<ChatMessageWithSender>("POST", `/api/chat/${activeRoom}`, { content });
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

  const { data: roomMembers = [] } = useQuery<{ userId: string; user?: User | null }[]>({
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
      queryClient.setQueryData<ChatHistoryPayload | ChatMessageWithSender[]>(historyKey, (old) => {
        const patch = (m: ChatMessageWithSender) => (m.id === messageId ? { ...m, ...meta } : m);
        if (Array.isArray(old)) return old.map(patch);
        if (!old?.messages) return old;
        return { ...old, messages: old.messages.map(patch) };
      });
    },
    onError: (err) => {
      toast({
        title: "Не удалось поставить реакцию",
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
        variant: "destructive",
      });
    },
  });

  const markRoomReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!roomId || !UUID_RE.test(messageId)) return;
      await apiRequest("POST", `/api/chat/rooms/${roomId}/read`, { messageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
    },
  });

  const lastMarkedReadRef = useRef<Record<string, string>>({});

  const pinMutation = useMutation({
    mutationFn: async ({ messageId, pin }: { messageId: string; pin: boolean }) => {
      if (!roomId) throw new Error("no room");
      if (pin) {
        await apiRequest("POST", `/api/chat/rooms/${roomId}/messages/${messageId}/pin`);
      } else {
        await apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${messageId}/pin`);
      }
    },
    onSuccess: (_data, variables) => {
      invalidateThread();
      if (variables.pin) {
        toast({ title: "Сообщение закреплено" });
      }
    },
    onError: () => {
      toast({ title: "Не удалось закрепить сообщение", variant: "destructive" });
    },
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
    onError: () => {
      toast({ title: "Не удалось изменить сообщение", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!roomId) throw new Error("no room");
      await apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${messageId}`);
    },
    onSuccess: invalidateThread,
    onError: () => {
      toast({ title: "Не удалось удалить сообщение", variant: "destructive" });
    },
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
        } else if (
          (data.type === "message_pinned" || data.type === "message_unpinned") &&
          data.roomSlug
        ) {
          queryClient.invalidateQueries({ queryKey: [`/api/chat/${data.roomSlug}`] });
          if (data.type === "message_pinned" && data.messageId) {
            const inRoom = data.roomSlug === activeRoom;
            toast({
              title: "Сообщение закреплено",
              description: inRoom
                ? "Нажмите на плашку сверху, чтобы перейти"
                : "Откройте чат группы",
              action: inRoom ? (
                <ToastAction
                  altText="Перейти"
                  onClick={() => scrollToMessage(String(data.messageId))}
                >
                  Перейти
                </ToastAction>
              ) : undefined,
            });
          }
        } else if (data.type === "error" && data.message) {
          toast({
            title: "Ошибка чата",
            description: String(data.message),
            variant: "destructive",
          });
        }
      } catch {
        /* ignore */
      }
    };
  }, [isAuthenticated, user, useHttpMode, queryClient, activeRoom, toast, scrollToMessage]);

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

  const currentWsMessages = wsMessages[activeRoom] || [];
  const allMessages = mergeChronologicalMessages(history, currentWsMessages);

  const prevScrollRoomRef = useRef(activeRoom);
  const prevScrollLenRef = useRef(0);

  useEffect(() => {
    const roomChanged = prevScrollRoomRef.current !== activeRoom;
    const grew = allMessages.length > prevScrollLenRef.current;
    prevScrollRoomRef.current = activeRoom;
    prevScrollLenRef.current = allMessages.length;
    if (roomChanged || grew) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages.length, activeRoom]);

  const lastReadableId = useMemo(() => {
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const id = allMessages[i]?.id;
      if (id && UUID_RE.test(String(id))) return String(id);
    }
    return null;
  }, [allMessages]);

  useEffect(() => {
    if (!roomId || !lastReadableId) return;
    if (lastMarkedReadRef.current[roomId] === lastReadableId) return;
    lastMarkedReadRef.current[roomId] = lastReadableId;
    markRoomReadMutation.mutate(lastReadableId);
  }, [roomId, lastReadableId, markRoomReadMutation]);
  const pinnedMessages = allMessages.filter((m) => m.id && pinnedIds.includes(m.id));
  const latestPinned = pinnedMessages[pinnedMessages.length - 1];

  useEffect(() => {
    const messageId = pendingScrollMessageId.current;
    if (!messageId || allMessages.length === 0) return;
    if (!allMessages.some((m) => m.id === messageId)) return;
    pendingScrollMessageId.current = null;
    window.setTimeout(() => scrollToMessage(messageId), 150);
  }, [allMessages, activeRoom, scrollToMessage]);

  const myRole = (activeRoomMeta as RoomListItem | undefined)?.myRole;
  const isRoomAdmin =
    myRole === "admin" || myRole === "owner" || activeRoomMeta?.createdBy === user?.id;
  const chatBgClass = getChatBackgroundClass(activeRoomMeta?.settings?.chatBackground);
  const canSend = !joinRequired && (useHttpMode ? !postMessage.isPending : wsConnected);
  const showLegacyJoinHint =
    Boolean(activeRoomMeta?.isLegacy) && !(activeRoomMeta as RoomListItem)?.myRole;

  const handleSend = async (contentOverride?: string) => {
    let body = (contentOverride ?? messageText).trim();
    if (!body || !canSend) return;
    if (replyTo && !contentOverride?.includes("[reply:")) {
      body = encodeReplyBlock(replyTo.username, replyTo.preview, body);
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

  const statusLabel = useHttpMode ? "HTTP · 4с" : wsConnected ? "Онлайн" : "Подключение…";

  return (
    <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-0 md:p-4">
      <div className="max-w-[1600px] mx-auto px-3 py-4 md:py-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="ait-section-title">Чаты</h1>
          <p className="text-muted-foreground mt-1">
            Группы — личные чаты в{" "}
            <Link href="/messages" className="text-ait-purple hover:underline">
              Сообщениях
            </Link>
          </p>
        </motion.div>

        <ChatFilterTabs
          layoutId="chat-page-filter"
          tabs={[
            { id: "all", label: "Мои группы" },
            { id: "unread", label: "Непрочит." },
            { id: "mine", label: "Участник" },
          ]}
          value={chatTab}
          onChange={setChatTab}
          className="mb-4"
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_1fr] gap-3"
          style={{ height: "calc(100dvh - var(--ait-header-h, 5rem))", minHeight: "560px" }}
        >
          <div className="ait-chat-panel flex flex-col min-h-0">
            <div className="ait-chat-panel-header p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-ait-purple" />
                  Группа
                </span>
                <div className="flex items-center gap-1">
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label="Создать группу"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Создать группу</DialogTitle>
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
                            onChange={(e) =>
                              setNewRoom({ ...newRoom, description: e.target.value })
                            }
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
                        {newRoom.visibility === "public" && (
                          <p className="text-xs text-muted-foreground">
                            Открытая группа не появится у всех в списке — её можно найти через поиск
                            (как в Telegram).
                          </p>
                        )}
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
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  placeholder="Поиск групп (умный, от 2 символов)…"
                  className="h-8 pl-8 text-sm bg-background/50"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {roomsLoading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Загрузка групп…
                  </div>
                ) : roomsError ? (
                  <div className="p-6 text-center text-sm space-y-2">
                    <p className="text-muted-foreground">Не удалось загрузить группы</p>
                    <Button variant="outline" size="sm" onClick={() => refetchRooms()}>
                      Повторить
                    </Button>
                  </div>
                ) : filteredRooms.length === 0 && discoverSearch.length < 2 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {roomQuery.trim()
                      ? "В ваших группах ничего не найдено"
                      : chatTab === "unread"
                        ? "Нет непрочитанных групп"
                        : chatTab === "mine"
                          ? "Вы ещё не состоите в группах"
                          : "Нет групп — создайте или найдите через поиск"}
                  </div>
                ) : (
                  <>
                    {filteredRooms.map((room) => (
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
                        <RoomAvatar
                          title={room.title}
                          avatarUrl={room.avatarUrl}
                          className="h-14 w-14"
                        />
                        <span className="text-sm font-medium flex-1 truncate">{room.title}</span>
                        {(room.unreadCount ?? 0) > 0 && (
                          <Badge className="shrink-0 bg-ait-orange border-0 text-[10px] min-w-[1.25rem] justify-center">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </Badge>
                        )}
                        {room.visibility === "private" && (
                          <Lock className="h-3 w-3 shrink-0 opacity-60" />
                        )}
                        {room.isLegacy && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {t("chat.legacy.badge")}
                          </Badge>
                        )}
                      </button>
                    ))}

                    {discoverSearch.length >= 2 && (
                      <div className="pt-3 mt-2 border-t border-white/10 space-y-1">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {t("chat.discover.header")}
                        </p>
                        {discoverLoading ? (
                          <div className="py-4 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-ait-purple" />
                          </div>
                        ) : discoverRooms.length === 0 ? (
                          <p className="px-2 py-2 text-xs text-muted-foreground">
                            {t("chat.discover.empty")}
                          </p>
                        ) : (
                          discoverRooms.map((room) => (
                            <div
                              key={room.id}
                              className="flex items-center gap-2 rounded-xl p-2 hover:bg-white/[0.04]"
                            >
                              <RoomAvatar
                                title={room.title}
                                avatarUrl={room.avatarUrl}
                                className="h-10 w-10 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{room.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {t("chat.discover.memberCount", { count: room.memberCount })}
                                  {room.description ? ` · ${room.description}` : ""}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0 h-8 text-xs"
                                disabled={joinRoomMutation.isPending}
                                onClick={() => joinRoomMutation.mutate(room.id)}
                              >
                                {t("chat.discover.join")}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="ait-chat-panel flex flex-col overflow-hidden min-h-0">
            {roomBreadcrumbs && (
              <div className="px-4 pt-3 pb-0 border-b border-white/5">
                <AppBreadcrumbs items={roomBreadcrumbs} className="mb-0" />
              </div>
            )}
            <div className="ait-chat-panel-header p-4 flex items-center gap-3">
              <RoomAvatar
                title={activeRoomMeta?.title ?? activeRoom}
                avatarUrl={activeRoomMeta?.avatarUrl}
                className="h-16 w-16"
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
                title="Настройки группы"
                aria-label="Настройки группы"
                onClick={() => setShowRoomInfo(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <Sheet open={showRoomInfo} onOpenChange={setShowRoomInfo}>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
                <SheetHeader className="p-4 pb-0">
                  <SheetTitle>Настройки группы</SheetTitle>
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

            {latestPinned?.id && (
              <button
                type="button"
                onClick={() => scrollToMessage(latestPinned.id!)}
                className="mx-4 mt-2 flex items-center gap-2 rounded-xl border border-ait-orange/30 bg-ait-orange/10 px-3 py-2 text-left hover:bg-ait-orange/15 transition-colors"
              >
                <Pin className="h-3.5 w-3.5 shrink-0 text-ait-orange" />
                <span className="text-xs text-ait-orange font-semibold shrink-0">Закреплено</span>
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {joinPreview.description}
                      </p>
                    )}
                    {joinPreview.memberCount != null && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("chat.joinGate.memberCount", { count: joinPreview.memberCount })}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {t("chat.joinGate.title")}
                  </p>
                  <Button
                    type="button"
                    className="ait-btn-glow"
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
                  <p className="text-sm">Загрузка сообщений…</p>
                </div>
              ) : historyError ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-3">
                  <p className="text-sm">Не удалось загрузить историю</p>
                  <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                    Повторить
                  </Button>
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Начните разговор о следующей поездке</p>
                </div>
              ) : (
                <div className="ait-chat-thread-inner space-y-4">
                  {allMessages.map((msg) => {
                    const isOwn = msg.userId === user?.id;
                    const isPinned = Boolean(msg.id && pinnedIds.includes(msg.id));
                    const senderName = isOwn
                      ? user
                        ? getUserDisplayLabel(user)
                        : "Я"
                      : msg.sender
                        ? getUserDisplayLabel(msg.sender)
                        : "Путешественник";
                    const senderInitial = isOwn
                      ? user
                        ? getUserInitial(user)
                        : "Я"
                      : msg.sender
                        ? getUserInitial(msg.sender)
                        : "?";
                    const senderAvatarUrl = isOwn
                      ? user?.profileImageUrl
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
                          reactionMutation.isPending &&
                          reactionMutation.variables?.messageId === msg.id
                        }
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

            {!joinRequired && (
              <div className="ait-chat-panel-header p-4 border-t">
                {showLegacyJoinHint && (
                  <p className="text-xs text-muted-foreground mb-2 px-1">
                    {t("chat.legacy.joinHint")}
                  </p>
                )}
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
                    aria-label="Отправить сообщение"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Chat;
