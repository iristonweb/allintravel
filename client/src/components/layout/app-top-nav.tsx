import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Home,
  Map,
  Users,
  Calendar,
  BookOpen,
  MoreHorizontal,
  Search,
  Menu,
  X,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ait-gradient-cta text-sm font-bold text-white shadow-ait-glow-purple">
        X
      </div>
      <span className="text-lg font-bold text-foreground hidden sm:inline">All In Travel</span>
    </Link>
  );
}

export default function AppTopNav() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifications } = useQuery<{
    friendRequests: number;
    unreadMessages: number;
  }>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const notifCount = (notifications?.friendRequests ?? 0) + (notifications?.unreadMessages ?? 0);

  const centerNav = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/map", label: "Карта", icon: Map },
    { href: "/social-feed", label: "Сообщество", icon: Users },
    { href: "/trips", label: "Планирование", icon: Calendar },
    { href: "/blog", label: "Блог", icon: BookOpen },
  ];

  const moreItems = [
    { href: "/places", label: "Места" },
    { href: "/events", label: "События" },
    { href: "/chat", label: "Чат" },
    { href: "/friends", label: "Друзья" },
  ];

  const logout = async () => {
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <BrandLogo />
          <Link href="/login">
            <Button variant="premium" size="sm">
              Войти
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:pl-[88px] md:pr-6">
        <BrandLogo />

        <nav className="hidden lg:flex items-center gap-1">
          {centerNav.map((item) => {
            const active =
              item.href === "/"
                ? location === "/"
                : location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    active
                      ? "text-foreground bg-white/8"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                <MoreHorizontal className="h-4 w-4" />
                Ещё
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="ait-glass-strong">
              {moreItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <DropdownMenuItem>{item.label}</DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <Link href="/places">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src={user?.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-ait-purple/30 text-xs">
                    {user?.firstName?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="ait-glass-strong">
              <Link href="/profile">
                <DropdownMenuItem>Профиль</DropdownMenuItem>
              </Link>
              <Link href="/messages">
                <DropdownMenuItem>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Сообщения
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-border/60 px-4 py-3 flex flex-col gap-1 bg-background/95">
          {[...centerNav, ...moreItems.map((i) => ({ ...i, icon: MoreHorizontal }))].map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
