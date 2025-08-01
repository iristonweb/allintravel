import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ChatMessage } from "@shared/schema";

interface ChatComponentProps {
  chatRoom: string;
  title?: string;
  height?: string;
}

export function ChatComponent({ chatRoom, title = "Чат", height = "h-96" }: ChatComponentProps) {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  const { data: initialMessages } = useQuery({
    queryKey: [`/api/chat/${chatRoom}`],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages || []);
    }
  }, [initialMessages]);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("Connected to WebSocket");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message" && data.message.chatRoom === chatRoom) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket");
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, [isAuthenticated, user?.id, chatRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !ws || !user) return;

    const messageData = {
      type: "chat_message",
      userId: user.id,
      content: message,
      chatRoom,
    };

    ws.send(JSON.stringify(messageData));
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "HH:mm", { locale: ru });
  };

  if (!isAuthenticated) {
    return (
      <Card className={height}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Войдите, чтобы участвовать в чате</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${height} flex flex-col`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {messages.map((msg) => {
            const isOwnMessage = msg.userId === user?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.profileImageUrl || ""} alt="User" />
                  <AvatarFallback>
                    {user?.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
                  <div
                    className={`px-3 py-2 rounded-lg max-w-xs ${
                      isOwnMessage
                        ? "bg-coral-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-coral-500 hover:bg-coral-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}