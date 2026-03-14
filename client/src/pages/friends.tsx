import { useState } from "react";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, MessageCircle, UserCheck, UserX, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Friendship } from "@shared/schema";

export function Friends() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: sentRequests = [] } = useQuery<Friendship[]>({
    queryKey: ["/api/friends/requests/sent"],
    enabled: isAuthenticated,
  });

  const { data: receivedRequests = [] } = useQuery<Friendship[]>({
    queryKey: ["/api/friends/requests/received"],
    enabled: isAuthenticated,
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/search/users", searchQuery],
    enabled: !!searchQuery && searchQuery.length > 1,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/friends/request/${userId}`),
    onSuccess: () => {
      toast({ title: "Запрос отправлен" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: ({ friendshipId, status }: { friendshipId: string; status: string }) =>
      apiRequest("PUT", `/api/friends/respond/${friendshipId}`, { status }),
    onSuccess: () => {
      toast({ title: "Запрос обработан" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/received"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => apiRequest("DELETE", `/api/friends/${friendId}`),
    onSuccess: () => {
      toast({ title: "Друг удален" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Войдите в систему</h1>
            <p className="text-muted-foreground">Чтобы управлять друзьями, необходимо войти в систему</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Друзья</h1>
            <p className="text-muted-foreground">
              Управляйте своими друзьями и находите новых попутчиков
            </p>
          </div>

          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="friends">
                <Users className="mr-2 h-4 w-4" />
                Друзья ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="mr-2 h-4 w-4" />
                Поиск
              </TabsTrigger>
              <TabsTrigger value="received">
                <UserPlus className="mr-2 h-4 w-4" />
                Входящие ({receivedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Отправленные ({sentRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {friends.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">У вас пока нет друзей</h3>
                    <p className="text-muted-foreground mb-4">
                      Найдите новых друзей через поиск или отправьте запросы
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {friends.map((friend) => (
                    <Card key={friend.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={friend.profileImageUrl ?? undefined} />
                              <AvatarFallback>
                                {friend.firstName?.[0] || friend.email?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {friend.firstName} {friend.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{friend.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Сообщение
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFriendMutation.mutate(friend.id)}
                              disabled={removeFriendMutation.isPending}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Поиск пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите имя или email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <Card key={result.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={result.profileImageUrl ?? undefined} />
                              <AvatarFallback>
                                {result.firstName?.[0] || result.email?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {result.firstName} {result.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{result.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => sendRequestMutation.mutate(result.id)}
                            disabled={sendRequestMutation.isPending}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Добавить в друзья
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              {receivedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Нет входящих запросов</h3>
                    <p className="text-muted-foreground">
                      Входящие запросы на добавление в друзья появятся здесь
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">Пользователь</h3>
                              <Badge variant="secondary">Входящий запрос</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                respondToRequestMutation.mutate({
                                  friendshipId: request.id,
                                  status: "accepted",
                                })
                              }
                              disabled={respondToRequestMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                respondToRequestMutation.mutate({
                                  friendshipId: request.id,
                                  status: "rejected",
                                })
                              }
                              disabled={respondToRequestMutation.isPending}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">Нет отправленных запросов</h3>
                    <p className="text-muted-foreground">
                      Отправленные запросы на добавление в друзья появятся здесь
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">Пользователь</h3>
                              <Badge variant="outline">Ожидает ответа</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Friends;
