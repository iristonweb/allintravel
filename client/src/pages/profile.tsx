import { useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  MessageCircle,
  Rss,
  BookOpen,
  Calendar,
  Wallet,
  Hash,
  Search,
  Edit,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

const hubLinks = [
  { href: "/social-feed", label: "Моя лента", icon: Rss, desc: "Посты и сообщество" },
  { href: "/blog", label: "Блог", icon: BookOpen, desc: "Публичные статьи" },
  { href: "/events", label: "События", icon: Calendar, desc: "Мои и ближайшие события" },
  { href: "/wallet", label: "Криптокошелёк", icon: Wallet, desc: "Demo — без блокчейна", badge: "Demo" },
  { href: "/profile/friends", label: "Друзья", icon: Users, desc: "По направлениям и поиск" },
  { href: "/messages", label: "Сообщения", icon: MessageCircle, desc: "Личные чаты" },
  { href: "/chat", label: "Мои комнаты", icon: Hash, desc: "Группы и обсуждения" },
];

export function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [nickSearch, setNickSearch] = useState("");

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/search/users", { q: nickSearch, exact: "1" }],
    enabled: nickSearch.replace(/^@/, "").length >= 3,
  });

  if (!isAuthenticated || !user) {
    return (
      <AppLayout contentClassName="py-16">
        <p className="text-center text-muted-foreground">Войдите в систему</p>
      </AppLayout>
    );
  }

  const handleNickSearch = () => {
    const term = nickSearch.trim().replace(/^@/, "");
    if (term.length < 3) return;
    navigate(`/u/${term}`);
  };

  return (
    <AppLayout contentClassName="py-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 overflow-hidden border-border/60">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={resolveMediaUrl(user.profileImageUrl)} />
                <AvatarFallback className="text-2xl">{getUserInitial(user)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{getUserDisplayLabel(user)}</h1>
                  {getUserHandle(user) && (
                    <span className="text-muted-foreground">{getUserHandle(user)}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4 mr-1" />
                      Редактировать
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/profile/settings">
                      <Settings className="h-4 w-4 mr-1" />
                      Настройки
                    </Link>
                  </Button>
                </div>
                <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{(friends as unknown[]).length}</strong> друзей
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-border/60">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Найти человека по @нику
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="@username"
                value={nickSearch}
                onChange={(e) => setNickSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNickSearch()}
              />
              <Button type="button" onClick={handleNickSearch}>
                Найти
              </Button>
            </div>
            {searchResults.length > 0 && nickSearch.length >= 3 && (
              <div className="mt-3 space-y-2">
                {searchResults.map((u) => (
                  <Link
                    key={u.id}
                    href={u.username ? `/u/${u.username}` : `/messages?with=${u.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} />
                      <AvatarFallback>{getUserInitial(u)}</AvatarFallback>
                    </Avatar>
                    <span>{getUserDisplayLabel(u)}</span>
                    {u.username && (
                      <span className="text-muted-foreground text-sm">@{u.username}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-3">Личный кабинет</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hubLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer border-border/60">
                <CardContent className="p-4 flex gap-3 items-start">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Link href="/map">
            <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer border-border/60">
              <CardContent className="p-4 flex gap-3 items-start">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Карта</div>
                  <p className="text-sm text-muted-foreground mt-0.5">Маршруты и места</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

export default Profile;
