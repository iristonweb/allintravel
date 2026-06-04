import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { PrivateMessage, User } from "@shared/schema";

interface Conversation {
  user: User;
  lastMessage: PrivateMessage | null;
  unreadCount: number;
}

export function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const withUserId =
    location === "/messages" && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("with")
      : null;

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const { data: userToOpen } = useQuery<User | null>({
    queryKey: ["/api/users", withUserId || ""],
    enabled: !!withUserId && withUserId !== user?.id,
  });

  useEffect(() => {
    if (withUserId && withUserId !== user?.id) {
      if (userToOpen) {
        const existing = conversations.find((c) => c.user.id === userToOpen.id);
        setSelectedConversation(
          existing ?? {
            user: userToOpen,
            lastMessage: null,
            unreadCount: 0,
          }
        );
      }
    } else if (!withUserId && selectedConversation?.user && !conversations.some((c) => c.user.id === selectedConversation.user.id)) {
      setSelectedConversation(null);
    }
  }, [withUserId, userToOpen, user?.id, conversations]);

  const { data: messages = [] } = useQuery<PrivateMessage[]>({
    queryKey: ["/api/messages", selectedConversation?.user.id],
    enabled: !!selectedConversation?.user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { receiverId: string; content: string }) =>
      apiRequest("POST", "/api/messages", messageData),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (senderId: string) =>
      apiRequest("PUT", `/api/messages/read/${senderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      receiverId: selectedConversation.user.id,
      content: newMessage,
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversation.user.id);
    }
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ru });
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMM", { locale: ru });
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
          <p className="text-muted-foreground">Чтобы отправлять сообщения, необходимо войти в систему</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Сообщения" description="Общайтесь с друзьями и попутчиками" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] mt-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Диалоги
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Нет сообщений</h3>
                      <p className="text-sm text-muted-foreground">
                        Начните общение с друзьями
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.user.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation?.user.id === conversation.user.id
                              ? "bg-muted"
                              : ""
                          }`}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.user.profileImageUrl ?? undefined} />
                              <AvatarFallback>
                                {conversation.user.firstName?.[0] ||
                                  conversation.user.email?.[0] ||
                                  "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">
                                  {conversation.user.firstName} {conversation.user.lastName}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {conversation.lastMessage
                                    ? formatDate(conversation.lastMessage.createdAt as unknown as string)
                                    : ""}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage?.content ?? "Нет сообщений"}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge className="mt-1 bg-primary">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar>
                        <AvatarImage src={selectedConversation.user.profileImageUrl ?? undefined} />
                        <AvatarFallback>
                          {selectedConversation.user.firstName?.[0] ||
                            selectedConversation.user.email?.[0] ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {selectedConversation.user.firstName}{" "}
                          {selectedConversation.user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.user.email}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 flex flex-col h-[calc(100vh-400px)]">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwn = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}
                                >
                                  {formatTime(message.createdAt as unknown as string)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Введите сообщение..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Выберите диалог</h3>
                    <p className="text-muted-foreground">
                      Выберите диалог из списка, чтобы начать общение
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
      </div>
    </AppLayout>
  );
}

export default Messages;
