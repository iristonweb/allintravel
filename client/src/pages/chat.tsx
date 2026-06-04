import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/app-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  MessageCircle,
  Users,
  MapPin,
  Route,
  Globe,
  Hash,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@shared/schema";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import type { UserLabelFields } from "@shared/user-display";

const CHAT_ROOMS = [
  { id: "general", label: "Общий", icon: Globe, group: "groups" as const },
  { id: "europe", label: "Европа", icon: MapPin, group: "groups" as const },
  { id: "asia", label: "Азия", icon: MapPin, group: "groups" as const },
  { id: "america", label: "Америка", icon: MapPin, group: "groups" as const },
  { id: "tips", label: "Советы", icon: Sparkles, group: "groups" as const },
  { id: "iceland-2024", label: "Исландия 2024", icon: Route, group: "trips" as const },
];

type ChatTab = "all" | "personal" | "groups";

type ChatMessageWithSender = ChatMessage & {
  sender?: (UserLabelFields & { id?: string; profileImageUrl?: string | null }) | null;
};

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

export function Chat() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [chatTab, setChatTab] = useState<ChatTab>("all");
  const [activeRoom, setActiveRoom] = useState("general");
  const [messageText, setMessageText] = useState("");
  const [wsMessages, setWsMessages] = useState<Record<string, ChatMessageWithSender[]>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [useHttpMode, setUseHttpMode] = useState(isVercelHost);
  const wsRef = useRef<WebSocket | null>(null);
  const wsFailCount = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredRooms = CHAT_ROOMS.filter((r) => {
    if (chatTab === "groups") return r.group === "groups";
    if (chatTab === "personal") return false;
    return true;
  });

  const historyKey = [`/api/chat/${activeRoom}`] as const;

  const { data: history = [] } = useQuery<ChatMessageWithSender[]>({
    queryKey: historyKey,
    enabled: isAuthenticated,
    refetchInterval: useHttpMode ? 4000 : false,
  });

  const postMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/chat/${activeRoom}`, { content });
      return (await res.json()) as ChatMessageWithSender;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKey });
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
          const messageWithSender = { ...data.message, sender: data.sender ?? null };
          setWsMessages((prev) => ({
            ...prev,
            [room]: [...(prev[room] || []), messageWithSender],
          }));
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, wsMessages, activeRoom]);

  const currentWsMessages = wsMessages[activeRoom] || [];
  const allMessages = [...history, ...currentWsMessages];
  const canSend = useHttpMode ? !postMessage.isPending : wsConnected;

  const handleSend = async () => {
    if (!messageText.trim() || !canSend) return;

    if (useHttpMode) {
      await postMessage.mutateAsync(messageText.trim());
      setMessageText("");
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "chat_message",
        userId: user?.id,
        content: messageText.trim(),
        chatRoom: activeRoom,
      }),
    );
    setMessageText("");
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

  const activeRoomMeta = CHAT_ROOMS.find((r) => r.id === activeRoom);

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
            Telegram + Discord — личные, групповые поездки и планирование маршрутов
          </p>
        </motion.div>

        <div className="flex gap-2 mb-4 ait-nav-pill rounded-full p-1 w-fit">
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
              onClick={() => setChatTab(t.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                chatTab === t.id ? "ait-nav-active text-white" : "text-slate-400 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4"
          style={{ height: "calc(100vh - 220px)", minHeight: "520px" }}
        >
          <GlassCard strong className="overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-ait-purple" />
                  Комнаты
                </span>
                <Badge variant="secondary" className="text-[10px] ait-glass">
                  {statusLabel}
                </Badge>
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
                  filteredRooms.map((room) => {
                    const Icon = room.icon;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setActiveRoom(room.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all",
                          activeRoom === room.id
                            ? "ait-nav-active"
                            : "hover:bg-white/5 text-slate-400",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">{room.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-white/10 text-[10px] text-muted-foreground flex gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Геолокация
              </span>
              <span className="flex items-center gap-1">
                <Route className="h-3 w-3" /> Маршруты
              </span>
            </div>
          </GlassCard>

          <GlassCard strong className="flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              {activeRoomMeta && (() => {
                const RoomIcon = activeRoomMeta.icon;
                return <RoomIcon className="h-5 w-5 text-ait-orange" />;
              })()}
              <div>
                <h2 className="font-semibold">{activeRoomMeta?.label ?? activeRoom}</h2>
                <p className="text-xs text-muted-foreground">Чат путешествия · совместное планирование</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Начните разговор о следующей поездке</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allMessages.map((msg, i) => {
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
                      <div
                        key={msg.id || `msg-${i}`}
                        className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                      >
                        <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-gradient-to-br from-ait-purple to-ait-orange text-white">
                          {senderInitial}
                        </div>
                        <div className={cn("flex flex-col gap-1 max-w-[75%]", isOwn && "items-end")}>
                          {!isOwn && (
                            <span className="text-xs text-muted-foreground px-1">{senderName}</span>
                          )}
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm",
                              isOwn
                                ? "ait-chat-bubble-own text-white rounded-tr-md"
                                : "ait-chat-bubble-other rounded-tl-md",
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground px-1">
                            {msg.createdAt
                              ? format(new Date(msg.createdAt as unknown as string), "HH:mm", {
                                  locale: ru,
                                })
                              : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={canSend ? "Сообщение…" : "Подключение…"}
                  disabled={!canSend}
                  className="ait-input-glass flex-1 border-0 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  variant="premium"
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={!messageText.trim() || !canSend}
                  className="rounded-2xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}

export default Chat;
