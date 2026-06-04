import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

const CHAT_ROOMS = [
  { id: "general", label: "Общий" },
  { id: "europe", label: "Европа" },
  { id: "asia", label: "Азия" },
  { id: "america", label: "Америка" },
  { id: "tips", label: "Советы" },
];

type ChatMessageWithSender = ChatMessage & {
  sender?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  } | null;
};

const isVercelHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") || import.meta.env.PROD);

export function Chat() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeRoom, setActiveRoom] = useState("general");
  const [messageText, setMessageText] = useState("");
  const [wsMessages, setWsMessages] = useState<Record<string, ChatMessageWithSender[]>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [useHttpMode, setUseHttpMode] = useState(isVercelHost);
  const wsRef = useRef<WebSocket | null>(null);
  const wsFailCount = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    ws.onerror = () => {
      setWsConnected(false);
    };

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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы участвовать в чате, необходимо войти</p>
        </div>
      </AppLayout>
    );
  }

  const statusLabel = useHttpMode
    ? "● HTTP (обновление каждые 4 с)"
    : wsConnected
      ? "● Онлайн"
      : "● Подключение...";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Чат"
          description={
            useHttpMode
              ? "Режим без WebSocket — сообщения через API (подходит для Vercel)"
              : "Общайтесь с попутчиками в реальном времени"
          }
          rightSlot={
            <Badge
              variant={wsConnected || useHttpMode ? "default" : "secondary"}
              className={wsConnected || useHttpMode ? "h-7 bg-secondary hover:bg-secondary" : "h-7"}
            >
              {statusLabel}
            </Badge>
          }
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8"
          style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}
        >
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Комнаты</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {CHAT_ROOMS.map((room) => (
                <Button
                  key={room.id}
                  variant={activeRoom === room.id ? "default" : "ghost"}
                  className={`w-full justify-start ${activeRoom === room.id ? "bg-primary hover:bg-primary/90" : ""}`}
                  onClick={() => setActiveRoom(room.id)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {room.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 flex flex-col overflow-hidden">
            <CardHeader className="border-b pb-3 flex-shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                #{CHAT_ROOMS.find((r) => r.id === activeRoom)?.label}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                {allMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground text-sm">
                      Нет сообщений. Начните разговор!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allMessages.map((msg, i) => {
                      const isOwn = msg.userId === user?.id;
                      const senderName = isOwn
                        ? user?.firstName || "Я"
                        : [msg.sender?.firstName, msg.sender?.lastName]
                            .filter(Boolean)
                            .join(" ") || "Путешественник";
                      const senderInitial = isOwn
                        ? user?.firstName?.[0] || "Я"
                        : msg.sender?.firstName?.[0] || msg.sender?.lastName?.[0] || "?";
                      return (
                        <div
                          key={msg.id || `msg-${i}`}
                          className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {senderInitial}
                          </div>
                          <div
                            className={`flex flex-col gap-0.5 max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"}`}
                          >
                            {!isOwn && (
                              <span className="text-xs text-muted-foreground px-1">{senderName}</span>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm ${
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-muted text-foreground rounded-tl-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-xs text-muted-foreground px-1">
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

              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={canSend ? "Написать сообщение..." : "Подключение к чату..."}
                    disabled={!canSend}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={!messageText.trim() || !canSend}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default Chat;
