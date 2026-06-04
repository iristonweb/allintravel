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
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 shrink-0 group">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl ait-btn-glow text-sm font-bold text-white">
        <span className="relative z-10">Ai</span>
      </div>
      <div className="hidden sm:block">
        <span className="text-lg font-bold text-white tracking-tight block leading-tight">
          All In Travel
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Travel OS
        </span>
      </div>
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
    { href: "/", label: "Главная" },
    { href: "/map", label: "Карта" },
    { href: "/social-feed", label: "Сообщество" },
    { href: "/trips", label: "Планирование" },
    { href: "/trips", label: "Маршруты", match: "/trips" },
    { href: "/blog", label: "Блог" },
  ];

  const moreItems = [
    { href: "/places", label: "Места" },
    { href: "/events", label: "События" },
    { href: "/friends", label: "Друзья" },
    { href: "/chat", label: "Чаты" },
  ];

  const logout = async () => {
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);

  if (!isAuthenticated) {
    return (
      <header className="fixed top-0 z-50 w-full ait-glass-nav h-20">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
          <BrandLogo />
          <Link href="/login">
            <Button className="ait-btn-glow rounded-2xl border-0 text-white font-semibold px-6">
              Войти
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 z-50 w-full ait-glass-nav h-20">
      <div className="max-w-[1600px] mx-auto flex h-20 items-center gap-4 px-4 lg:px-8">
        <BrandLogo />

        <nav className="hidden xl:flex items-center justify-center flex-1 gap-1">
          {centerNav.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href}>
              <span
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "text-white ait-nav-active"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1"
              >
                Ещё <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="ait-glass-strong border-white/10 min-w-[180px]">
              {moreItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <DropdownMenuItem className="cursor-pointer">{item.label}</DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <Link href="/map">
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-white hover:bg-white/8 h-11 w-11">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="relative rounded-xl text-slate-300 hover:text-white hover:bg-white/8 h-11 w-11">
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
              )}
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-white hover:bg-white/8 h-11 w-11 hidden sm:flex">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-2xl p-1 h-11 w-11 hover:bg-white/8">
                <Avatar className="h-9 w-9 border-2 border-white/20 ait-neon-purple">
                  <AvatarImage src={user?.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#8b5cf6] to-[#ff7a18] text-xs text-white">
                    {user?.firstName?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="ait-glass-strong border-white/10">
              <Link href="/profile">
                <DropdownMenuItem>Профиль</DropdownMenuItem>
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
            className="xl:hidden rounded-xl h-11 w-11"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="xl:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-1 bg-[#050816]/95 backdrop-blur-xl"
        >
          {centerNav.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href}>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Button>
            </Link>
          ))}
        </motion.nav>
      )}
    </header>
  );
}
