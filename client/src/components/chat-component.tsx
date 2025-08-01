import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Hash } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface ChatComponentProps {
  chatRoom?: string;
}

export default function ChatComponent({ chatRoom = "general" }: ChatComponentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages } = useQuery({
    queryKey: ["/api/chat", chatRoom],
    enabled: !!user,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Initialize WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to chat");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_message" && data.message) {
            setMessages(prev => [...prev, data.message]);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("Disconnected from chat");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat. Please try again.",
          variant: "destructive",
        });
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      toast({
        title: "Connection Error",
        description: "Unable to establish chat connection.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!message.trim() || !user || !wsRef.current || !isConnected) return;

    try {
      const messageData = {
        type: "chat_message",
        userId: user.id,
        content: message.trim(),
        chatRoom: chatRoom,
      };

      wsRef.current.send(JSON.stringify(messageData));
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to Send",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (messageUserId: string) => {
    // For demonstration, return different names based on userId
    const names = ["Alex_Traveler", "FoodieGirl92", "RomeLocal", "TravelBuddy"];
    const index = messageUserId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % names.length;
    return names[index];
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Hash className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium text-gray-900 capitalize">{chatRoom}</h3>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {messages.length} messages
          </div>
        </div>

        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="flex items-start space-x-3">
                <img
                  src={`https://images.unsplash.com/photo-${507003211169 + (index % 3) * 1000}-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {msg.userId === user?.id ? "You" : getUserDisplayName(msg.userId)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-3">
            <img
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 flex items-center space-x-2">
              <Input
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!message.trim() || !isConnected}
                className="bg-primary text-white hover:bg-primary/90 shrink-0"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
