import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import ChatFilterTabs from "@/components/chat/ChatFilterTabs";
import ChatSidebarPanel from "@/components/chat/ChatSidebarPanel";
import GroupChatPanel from "@/components/chat/GroupChatPanel";
import { getChatBackgroundClass } from "@/lib/chat-backgrounds";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import PersonalChatThread from "@/components/chat/PersonalChatThread";
import ChatThreadPlaceholder from "@/components/chat/ChatThreadPlaceholder";
import {
  type ChatTab,
  type ReplyTarget,
  type Conversation,
  type RoomListItem,
  type ChatMessageWithSender,
  type DiscoverRoom,
  type ChatHistoryPayload,
  fetchChatHistory,
  chatPollIntervalMs,
  chatHistoryErrorMessage,
} from "@/lib/chat-page-types";
import type { ChatRoom, MessageReactionMeta, Trip, User } from "@shared/schema";
import { mergeChronologicalMessages } from "@/lib/chat-thread";
import { messagePreview, encodeReplyBlock } from "@/lib/chat-message";
import { getUserDisplayLabel } from "@shared/user-display";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslation } from "react-i18next";

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function Chat() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const urlChatTab = useMemo((): ChatTab => {
    const tab = new URLSearchParams(searchString).get("tab");
    if (tab === "unread" || tab === "mine" || tab === "personal") return tab;
    return "all";
  }, [searchString]);
  const [chatTab, setChatTab] = useState<ChatTab>(urlChatTab);
  const urlWithUserId = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("with")?.trim() || null;
  }, [searchString]);
  const urlRoom = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("room")?.trim() || null;
  }, [searchString]);

  useEffect(() => {
    setChatTab(urlChatTab);
  }, [urlChatTab]);

  useEffect(() => {
    if (!urlWithUserId) return;
    if (chatTab === "personal" || chatTab === "unread") return;
    const params = new URLSearchParams(searchString);
    params.set("tab", "personal");
    navigate(`/chat?${params.toString()}`);
  }, [urlWithUserId, chatTab, searchString, navigate]);

  useEffect(() => {
    if (chatTab !== "personal" || !urlRoom || urlWithUserId) return;
    const params = new URLSearchParams(searchString);
    params.delete("room");
    params.delete("message");
    const qs = params.toString();
    navigate(`/chat?${qs ? `?${qs}` : ""}`);
  }, [chatTab, urlRoom, urlWithUserId, searchString, navigate]);

  const handleChatTabChange = useCallback(
    (tab: ChatTab) => {
      setChatTab(tab);
      const params = new URLSearchParams(searchString);
      if (tab === "all") params.delete("tab");
      else params.set("tab", tab);
      if (tab === "personal" || tab === "unread") {
        params.delete("room");
        params.delete("message");
      } else {
        params.delete("with");
      }
      const qs = params.toString();
      navigate(`/chat${qs ? `?${qs}` : ""}`);
    },
    [navigate, searchString],
  );

  const openPersonalChat = useCallback(
    (userId: string) => {
      const params = new URLSearchParams(searchString);
      const tab = chatTab === "unread" ? "unread" : "personal";
      params.set("tab", tab);
      params.set("with", userId);
      params.delete("room");
      params.delete("message");
      navigate(`/chat?${params.toString()}`);
    },
    [navigate, searchString, chatTab],
  );

  const selectRoom = useCallback(
    (slug: string) => {
      setActiveRoom(slug);
      const params = new URLSearchParams(searchString);
      if (slug === "general") params.delete("room");
      else params.set("room", slug);
      params.delete("with");
      params.delete("message");
      const qs = params.toString();
      navigate(`/chat${qs ? `?${qs}` : ""}`);
    },
    [navigate, searchString],
  );

  const clearThreadSelection = useCallback(() => {
    const params = new URLSearchParams(searchString);
    params.delete("with");
    params.delete("room");
    params.delete("message");
    const qs = params.toString();
    navigate(`/chat${qs ? `?${qs}` : ""}`);
  }, [navigate, searchString]);

  const mobileGroupThreadOpen =
    Boolean(urlRoom) &&
    (chatTab === "unread" || chatTab === "all" || chatTab === "mine");
  const mobileThreadOpen = Boolean(urlWithUserId) || mobileGroupThreadOpen;
  const mobileGroupListOnly =
    (chatTab === "all" || chatTab === "mine") && !urlRoom && !urlWithUserId;
  const showChatPlaceholder =
    !urlWithUserId &&
    ((chatTab === "personal" && !urlRoom) ||
      (chatTab === "unread" && !urlRoom));

  const searchPlaceholder = useMemo(() => {
    if (chatTab === "unread") return t("chat.sidebar.searchAllPlaceholder");
    if (chatTab === "personal") return t("chat.sidebar.searchDialogsPlaceholder");
    return t("chat.sidebar.searchPlaceholder");
  }, [chatTab, t]);
  const urlDiscoverQ = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("q")?.trim() ?? "";
  }, [searchString]);
  const [roomQuery, setRoomQuery] = useState(urlDiscoverQ);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (urlDiscoverQ) {
      setRoomQuery(urlDiscoverQ);
      if (urlDiscoverQ.length >= 2) setSearchFocused(true);
    }
  }, [urlDiscoverQ]);
  const [activeRoom, setActiveRoom] = useState("general");
  const [showRoomInfo, setShowRoomInfo] = useState(false);
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

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
    refetch: refetchConversations,
  } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
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
    enabled: isAuthenticated && chatTab !== "personal" && discoverSearch.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    const joinMatch = window.location.pathname.match(/^\/chat\/join\/([^/]+)/);
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
  }, [isAuthenticated, queryClient, toast, t]);

  const unreadPersonalCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const unreadGroupCount = rooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0);
  const totalUnreadCount = unreadPersonalCount + unreadGroupCount;

  const matchQuery = useCallback((text: string) => {
    const q = roomQuery.trim().toLowerCase();
    return !q || text.toLowerCase().includes(q);
  }, [roomQuery]);

  const filteredRooms = rooms
    .filter((r) => {
      if (chatTab === "personal") return false;
      if (chatTab === "mine") return r.myRole != null;
      if (chatTab === "unread") return (r.unreadCount ?? 0) > 0;
      return true;
    })
    .filter(
      (r) =>
        matchQuery(r.title) || (r.description ? matchQuery(r.description) : false),
    );

  const visibleConversations = useMemo(() => {
    const list =
      chatTab === "unread"
        ? conversations.filter((c) => c.unreadCount > 0)
        : chatTab === "personal"
          ? conversations
          : [];
    return list.filter((c) => matchQuery(getUserDisplayLabel(c.user)));
  }, [conversations, chatTab, matchQuery]);

  const [docVisible, setDocVisible] = useState(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true,
  );

  useEffect(() => {
    const onVis = () => setDocVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const historyKey = useMemo(() => [`/api/chat/${activeRoom}`] as const, [activeRoom]);
  const groupChatActivityRef = useRef(Date.now());

  const {
    data: historyPayload,
    isLoading: historyLoading,
    isError: historyError,
    error: historyFetchError,
    refetch: refetchHistory,
  } = useQuery<ChatHistoryPayload | ChatMessageWithSender[]>({
    queryKey: historyKey,
    queryFn: async () => {
      const cached = queryClient.getQueryData<ChatHistoryPayload | ChatMessageWithSender[]>(
        historyKey,
      );
      const existing: ChatMessageWithSender[] = Array.isArray(cached)
        ? cached
        : (cached?.messages ?? []);
      const lastId =
        useHttpMode && existing.length > 0 ? existing[existing.length - 1]?.id : undefined;
      const payload = await fetchChatHistory(activeRoom, lastId ?? null);
      if (!lastId || !payload.messages?.length) return payload;
      groupChatActivityRef.current = Date.now();
      return {
        ...payload,
        messages: mergeChronologicalMessages(existing, payload.messages),
      };
    },
    enabled: isAuthenticated && Boolean(activeRoom),
    refetchInterval: useHttpMode
      ? () =>
          chatPollIntervalMs(
            docVisible,
            Date.now() - groupChatActivityRef.current < 30_000,
          )
      : false,
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
      { label: t("chat.page.group.tripsBreadcrumb"), href: "/trips" },
      { label: breadcrumbTrip.title, href: `/trips/${effectiveTripId}` },
      { label: t("chat.page.group.chatBreadcrumb") },
    ];
  }, [effectiveTripId, breadcrumbTrip, t]);

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
        title: t("chat.page.errors.send"),
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
        title: t("chat.page.errors.reaction"),
        description: err instanceof Error ? err.message : t("chat.page.errors.retry"),
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
        toast({ title: t("chat.page.group.pinnedToast") });
      }
    },
    onError: () => {
      toast({ title: t("chat.page.errors.pin"), variant: "destructive" });
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
      toast({ title: t("chat.page.errors.edit"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!roomId) throw new Error("no room");
      await apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${messageId}`);
    },
    onSuccess: invalidateThread,
    onError: () => {
      toast({ title: t("chat.page.errors.delete"), variant: "destructive" });
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
              title: t("chat.page.group.pinnedToast"),
              description: inRoom
                ? t("chat.page.group.pinnedToastHint")
                : t("chat.page.group.pinnedToastOpen"),
              action: inRoom ? (
                <ToastAction
                  altText={t("chat.page.group.goToPinned")}
                  onClick={() => scrollToMessage(String(data.messageId))}
                >
                  {t("chat.page.group.goToPinned")}
                </ToastAction>
              ) : undefined,
            });
          }
        } else if (data.type === "error" && data.message) {
          toast({
            title: t("chat.page.group.chatError"),
            description: String(data.message),
            variant: "destructive",
          });
        }
      } catch {
        /* ignore */
      }
    };
  }, [isAuthenticated, user, useHttpMode, queryClient, activeRoom, toast, scrollToMessage, t]);

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
        title: t("chat.page.errors.reply"),
        description: t("chat.page.errors.replyNoUsername"),
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
          <h1 className="text-2xl font-bold mb-4">{t("chat.page.loginTitle")}</h1>
          <p className="text-muted-foreground">{t("chat.page.loginHint")}</p>
        </div>
      </AppLayout>
    );
  }

  const statusLabel = useHttpMode
    ? t("chat.page.sidebar.statusHttpDynamic", {
        sec: Math.round(
          chatPollIntervalMs(docVisible, Date.now() - groupChatActivityRef.current < 30_000) / 1000,
        ),
      })
    : wsConnected
      ? t("chat.page.sidebar.statusOnline")
      : t("chat.page.sidebar.statusConnecting");

  return (
    <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-0 md:p-4">
      <div className="max-w-[1600px] mx-auto px-3 py-4 md:py-6">
        <PageShell
          title={t("chat.page.title")}
          description={t("chat.page.subtitle")}
          titleVariant="immersive"
        >

        <ChatFilterTabs
          layoutId="chat-page-filter"
          tabs={[
            { id: "all", label: t("chat.page.tabs.all") },
            {
              id: "unread",
              label:
                totalUnreadCount > 0
                  ? t("chat.page.tabs.unreadCount", { count: totalUnreadCount })
                  : t("chat.page.tabs.unread"),
            },
            { id: "mine", label: t("chat.page.tabs.mine") },
            {
              id: "personal",
              label:
                conversations.length > 0
                  ? t("chat.page.tabs.personalCount", { count: conversations.length })
                  : t("chat.page.tabs.personal"),
            },
          ]}
          value={chatTab}
          onChange={handleChatTabChange}
          className="mb-4"
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_1fr] gap-3"
          style={{ height: "calc(100dvh - var(--ait-header-h, 5rem))", minHeight: "560px" }}
        >
          <div className={cn(mobileThreadOpen && "hidden lg:flex")}>
            <ChatSidebarPanel
              chatTab={chatTab}
              statusLabel={statusLabel}
              roomQuery={roomQuery}
              onRoomQueryChange={setRoomQuery}
              onSearchFocus={() => setSearchFocused(true)}
              onSearchBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
              searchPlaceholder={searchPlaceholder}
              discoverSearch={discoverSearch}
              searchFocused={searchFocused}
              urlDiscoverQ={urlDiscoverQ}
              discoverRooms={discoverRooms}
              discoverLoading={discoverLoading}
              joinRoomMutation={joinRoomMutation}
              visibleConversations={visibleConversations}
              conversationsLoading={conversationsLoading}
              conversationsError={conversationsError}
              refetchConversations={refetchConversations}
              roomsLoading={roomsLoading}
              roomsError={roomsError}
              refetchRooms={refetchRooms}
              filteredRooms={filteredRooms}
              urlWithUserId={urlWithUserId}
              activeRoom={activeRoom}
              onOpenPersonalChat={openPersonalChat}
              onSelectRoom={selectRoom}
            />
          </div>

          <div
            className={cn(
              "ait-chat-panel flex flex-col overflow-hidden min-h-0",
              !mobileThreadOpen && (showChatPlaceholder || mobileGroupListOnly) && "hidden lg:flex",
            )}
          >
            {urlWithUserId ? (
              <PersonalChatThread
                peerUserId={urlWithUserId}
                onBack={mobileThreadOpen ? clearThreadSelection : undefined}
              />
            ) : showChatPlaceholder ? (
              <ChatThreadPlaceholder chatTab={chatTab === "unread" ? "unread" : "personal"} />
            ) : (
              <GroupChatPanel
                mobileThreadOpen={mobileThreadOpen}
                onBack={clearThreadSelection}
                roomBreadcrumbs={roomBreadcrumbs}
                activeRoom={activeRoom}
                activeRoomMeta={activeRoomMeta}
                showRoomInfo={showRoomInfo}
                onShowRoomInfoChange={setShowRoomInfo}
                currentUser={user}
                onLeftRoom={() => selectRoom("general")}
                latestPinned={latestPinned}
                pinnedMessages={pinnedMessages}
                pinnedIds={pinnedIds}
                onScrollToMessage={scrollToMessage}
                joinRequired={Boolean(joinRequired)}
                joinPreview={joinPreview}
                joinRoomMutation={joinRoomMutation}
                historyLoading={historyLoading}
                historyError={historyError}
                historyErrorMessage={chatHistoryErrorMessage(historyFetchError, t)}
                onRefetchHistory={refetchHistory}
                allMessages={allMessages}
                chatBgClass={chatBgClass}
                scrollRef={scrollRef}
                roomId={roomId}
                isRoomAdmin={isRoomAdmin}
                reactionMutation={reactionMutation}
                pinMutation={pinMutation}
                deleteMutation={deleteMutation}
                editMutation={editMutation}
                onStartReply={startReply}
                showLegacyJoinHint={showLegacyJoinHint}
                messageText={messageText}
                onMessageTextChange={setMessageText}
                onSend={handleSend}
                canSend={canSend}
                mentionSuggestUsers={mentionSuggestUsers}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            )}
          </div>
        </div>
        </PageShell>
      </div>
    </AppLayout>
  );
}

export default Chat;
