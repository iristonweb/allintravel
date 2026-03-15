import { useState, useEffect, useRef, useCallback } from "react";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ChatMessage } from "@shared/schema";

const CHAT_ROOMS = [
  { id: "general", label: "Общий" },
  { id: "europe", label: "Европа" },
  { id: "asia", label: "Азия" },
  { id: "america", label: "Америка" },
  { id: "tips", label: "Советы" },
];

export function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [activeRoom, setActiveRoom] = useState("general");
  const [messageText, setMessageText] = useState("");
  const [wsMessages, setWsMessages] = useState<Record<string, ChatMessage[]>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const activeRoomRef = useRef(activeRoom);
  const scrollRef = useRef<HTMLDivElement>(null);

  activeRoomRef.current = activeRoom;

  const { data: history = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${activeRoom}`],
    enabled: isAuthenticated,
  });

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
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
          setWsMessages((prev) => ({
            ...prev,
            [room]: [...(prev[room] || []), data.message],
          }));
        }
      } catch {}
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, wsMessages, activeRoom]);

  const currentWsMessages = wsMessages[activeRoom] || [];
  const allMessages = [...history, ...currentWsMessages];

  const handleSend = () => {
    if (!messageText.trim()) return;
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
      })
    );
    setMessageText("");
  };

  const handleRoomChange = (room: string) => {
    setActiveRoom(room);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы участвовать в чате, необходимо войти</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Чат путешественников</h1>
              <p className="text-muted-foreground">Общайтесь с попутчиками в реальном времени</p>
            </div>
            <Badge
              variant={wsConnected ? "default" : "secondary"}
              className={`h-7 ${wsConnected ? "bg-green-500 hover:bg-green-500" : ""}`}
            >
              {wsConnected ? "● Онлайн" : "● Подключение..."}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}>
            {/* Room list */}
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
                    onClick={() => handleRoomChange(room.id)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {room.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Chat window */}
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
                        return (
                          <div
                            key={msg.id || `ws-${i}`}
                            className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                          >
                            <div
                              className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                                isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isOwn ? (user?.firstName?.[0] || "Я") : "?"}
                            </div>
                            <div
                              className={`flex flex-col gap-0.5 max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"}`}
                            >
                              {!isOwn && (
                                <span className="text-xs text-muted-foreground px-1">Путешественник</span>
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
                                  ? format(new Date(msg.createdAt as unknown as string), "HH:mm", { locale: ru })
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
                      placeholder={wsConnected ? "Написать сообщение..." : "Подключение к чату..."}
                      disabled={!wsConnected}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || !wsConnected}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!wsConnected && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      Устанавливаем соединение...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
