import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { AppNotification } from "@shared/notification-types";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/brand/brand-logo";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { GuestAnchorLink } from "@/components/nav/guest-anchor-link";
import {
  guestAnchors,
  sidebarDiscoverNav,
  sidebarExtraNav,
  sidebarPrimaryNav,
  scrollToAnchor,
} from "@/lib/nav-config";

const pageTitles: Record<string, string> = {
  "/": "Главная",
  "/map": "Карта",
  "/trips": "Поездки",
  "/social-feed": "Сообщество",
  "/friends": "Друзья",
  "/messages": "Сообщения",
  "/profile": "Профиль",
  "/places": "Места",
  "/events": "События",
  "/blog": "Блог",
  "/wallet": "Кошелёк",
  "/chat": "Комнаты",
};

function resolvePageTitle(path: string): string | null {
  if (pageTitles[path]) return pageTitles[path];
  const base = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
  return pageTitles[base] ?? null;
}

export default function AppTopNav() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: notifications } = useQuery<{
    friendRequests: number;
    unreadMessages: number;
    totalUnread?: number;
    items: AppNotification[];
  }>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const unreadItems = (notifications?.items ?? []).filter((n) => !n.isRead);
  const notifCount =
    notifications?.totalUnread ??
    unreadItems.length + (notifications?.friendRequests ?? 0) + (notifications?.unreadMessages ?? 0);
  const friendRequestCount = notifications?.friendRequests ?? 0;
  const unreadMessageCount = notifications?.unreadMessages ?? 0;

  const markReadAndGo = async (item: AppNotification) => {
    try {
      await apiRequest("PUT", `/api/notifications/${item.id}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch {
      /* ignore */
    }
    if (item.link) window.location.href = item.link;
  };

  const logout = async () => {
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);

  const pageTitle = resolvePageTitle(location);

  if (!isAuthenticated) {
    return (
      <header className="fixed top-0 z-50 w-full ait-glass-nav h-20">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between gap-4 px-4 lg:px-8">
          <BrandLogo variant="nav" showText />
          <nav className="hidden sm:flex items-center gap-1">
            {guestAnchors.map((item) => (
              <GuestAnchorLink
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-full text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {item.label}
              </GuestAnchorLink>
            ))}
          </nav>
          <Link href="/login">
            <Button className="ait-btn-glow rounded-2xl border-0 text-white font-semibold px-6 shrink-0">
              Войти
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  const menuSections = [
    { title: "Основное", items: sidebarPrimaryNav },
    { title: "Каталог", items: sidebarDiscoverNav },
    { title: "Ещё", items: sidebarExtraNav },
  ];

  return (
    <header className="fixed top-0 z-50 w-full ait-glass-nav h-20">
      <div className="max-w-[1600px] mx-auto flex h-20 items-center gap-3 px-4 lg:px-8 md:pl-[calc(72px+1rem)]">
        <BrandLogo variant="nav" showText className="shrink-0" />

        {location === "/" && (
          <nav className="hidden lg:flex xl:hidden items-center gap-1 shrink-0 min-w-0">
            {guestAnchors.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => scrollToAnchor(item.href)}
                className="px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {pageTitle && (
          <p className="hidden md:block flex-1 min-w-0 text-sm font-medium text-slate-300 truncate pl-1">
            {pageTitle}
          </p>
        )}

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          {user?.isAdmin && (
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-ait-orange px-2 py-1 rounded-full border border-ait-orange/40 mr-1">
              Admin
            </span>
          )}
          <Link href="/map" title="Карта и поиск мест">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-slate-300 hover:text-white hover:bg-white/8 h-11 w-11"
            >
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl text-slate-300 hover:text-white hover:bg-white/8 h-11 w-11"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="ait-glass-strong border-white/10 min-w-[300px] max-h-[70vh] overflow-y-auto">
              {unreadItems.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">Нет новых уведомлений</p>
              ) : (
                unreadItems.slice(0, 12).map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="cursor-pointer flex flex-col items-start gap-0.5 py-2"
                    onClick={() => void markReadAndGo(item)}
                  >
                    <span className="font-medium text-sm">{item.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">{item.body}</span>
                    {item.createdAt && (
                      <span className="text-[10px] text-muted-foreground/80">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ru })}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <Link href="/profile/friends">
                <DropdownMenuItem className="cursor-pointer">
                  Заявки в друзья
                  {friendRequestCount > 0 && (
                    <span className="ml-auto text-xs font-bold text-ait-orange">{friendRequestCount}</span>
                  )}
                </DropdownMenuItem>
              </Link>
              <Link href="/messages">
                <DropdownMenuItem className="cursor-pointer">
                  Сообщения
                  {unreadMessageCount > 0 && (
                    <span className="ml-auto text-xs font-bold text-ait-orange">{unreadMessageCount}</span>
                  )}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/messages" title="Сообщения">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-slate-300 hover:text-white hover:bg-white/8 h-11 w-11"
            >
              <MessageCircle className="h-5 w-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
              )}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-2xl p-1 h-11 w-11 hover:bg-white/8">
                <Avatar className="h-9 w-9 border-2 border-white/20 ait-neon-purple">
                  <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
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
            className="md:hidden rounded-xl h-11 w-11"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-4 bg-[#050816]/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto"
        >
          {menuSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 mb-1">
                {section.title}
              </p>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      isActive(item.href) && "ait-nav-active text-white",
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                    {item.href === "/wallet" && (
                      <span className="ml-auto text-[10px] font-bold text-ait-orange">Demo</span>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          ))}
        </motion.nav>
      )}
    </header>
  );
}
