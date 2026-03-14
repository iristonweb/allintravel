import NavigationHeader from "@/components/navigation-header";
import HeroSection from "@/components/hero-section";
import InteractiveMap from "@/components/interactive-map";
import PlaceCard from "@/components/place-card";
import TravelCompanionCard from "@/components/travel-companion-card";
import EventCard from "@/components/event-card";
import ChatComponent from "@/components/chat-component";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, MessageCircle, TrendingUp, Heart, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Place, Trip, Event, TravelPost, User } from "@shared/schema";

export function Home() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 6 }],
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { limit: 4 }],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", { upcoming: true, limit: 4 }],
  });

  const { data: socialPosts = [] } = useQuery<TravelPost[]>({
    queryKey: ["/api/posts", { limit: 3 }],
    enabled: isAuthenticated,
  });

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <HeroSection />
      
      <div className="container mx-auto px-4 py-12">
        {isAuthenticated && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Добро пожаловать, {user?.firstName}!</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Посмотрите что нового у ваших друзей и в сообществе путешественников
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ваша статистика</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Друзья</span>
                        <Badge variant="secondary">{friends.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Посты</span>
                        <Badge variant="secondary">{socialPosts.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Поездки</span>
                        <Badge variant="secondary">0</Badge>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Link href="/friends">
                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Найти друзей
                        </Button>
                      </Link>
                      <Link href="/social-feed">
                        <Button size="sm" variant="outline" className="w-full">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Создать пост
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Активность друзей</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {friends.length === 0 ? (
                      <div className="text-center py-4">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Добавьте друзей, чтобы видеть их активность
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {friends.slice(0, 3).map((friend) => (
                          <div key={friend.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={friend.profileImageUrl ?? undefined} />
                              <AvatarFallback>
                                {friend.firstName?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {friend.firstName} {friend.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Недавно присоединился
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Лента друзей</h3>
                  <Link href="/social-feed">
                    <Button variant="outline" size="sm">Показать все</Button>
                  </Link>
                </div>
                
                {socialPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-semibold mb-2">Пока нет постов</h4>
                      <p className="text-muted-foreground mb-4">
                        Подпишитесь на других путешественников или создайте свой первый пост
                      </p>
                      <Link href="/social-feed">
                        <Button className="bg-primary hover:bg-primary/90">
                          Создать пост
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {socialPosts.map((post) => (
                      <Card key={post.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">Пользователь</h4>
                              <p className="text-sm text-muted-foreground">2 часа назад</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <h5 className="font-semibold mb-2">{post.title}</h5>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <button className="flex items-center gap-1 hover:text-red-500">
                              <Heart className="h-4 w-4" />
                              Нравится
                            </button>
                            <button className="flex items-center gap-1 hover:text-foreground">
                              <MessageCircle className="h-4 w-4" />
                              Комментарии
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Исследуйте места</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Откройте для себя лучшие рестораны, отели и достопримечательности на интерактивной карте
            </p>
          </div>
          <InteractiveMap places={places as any[]} />
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Популярные места</h2>
              <p className="text-muted-foreground">Места, которые рекомендуют путешественники</p>
            </div>
            <Button variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              Все места
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.slice(0, 6).map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Найти попутчиков</h2>
              <p className="text-muted-foreground">Присоединяйтесь к запланированным поездкам</p>
            </div>
            <Link href="/trips">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Все поездки
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.slice(0, 4).map((trip) => (
              <TravelCompanionCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Предстоящие события</h2>
              <p className="text-muted-foreground">Не пропустите интересные мероприятия</p>
            </div>
            <Link href="/events">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Все события
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.slice(0, 4).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Сообщество путешественников</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Общайтесь, делитесь опытом и планируйте путешествия вместе
            </p>
          </div>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">
                <MessageCircle className="mr-2 h-4 w-4" />
                Общий чат
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="mr-2 h-4 w-4" />
                Популярное
              </TabsTrigger>
              <TabsTrigger value="community">
                <Users className="mr-2 h-4 w-4" />
                Сообщество
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-6">
              <ChatComponent chatRoom="general" title="Общий чат путешественников" />
            </TabsContent>
            
            <TabsContent value="trending" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Популярные обсуждения</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Лучшие места для фотосессий в Петербурге</h4>
                      <p className="text-sm text-muted-foreground">Обсуждение популярных локаций для фотографий</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>124 комментария</span>
                        <span>89 лайков</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Бюджетное путешествие по Европе</h4>
                      <p className="text-sm text-muted-foreground">Советы по экономии на путешествиях</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>78 комментариев</span>
                        <span>156 лайков</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="community" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Активные пользователи</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">1,234</div>
                      <p className="text-sm text-muted-foreground">путешественников</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Поездки сегодня</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary-foreground mb-2">47</div>
                      <p className="text-sm text-muted-foreground">активных поездок</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Новые отзывы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent-foreground mb-2">156</div>
                      <p className="text-sm text-muted-foreground">за сегодня</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}

export default Home;
