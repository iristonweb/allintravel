import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Bell,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  Home,
  MapPin,
  Users,
  Calendar,
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

function NavigationHeader() {
  const { user, isAuthenticated } = useAuth();
  const { i18n } = useTranslation();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications } = useQuery<{
    friendRequests: number;
    unreadMessages: number;
    items: { type: string; id: string; message: string }[];
  }>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const notifCount = (notifications?.friendRequests ?? 0) + (notifications?.unreadMessages ?? 0);

  const primaryNavItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/places", label: "Места", icon: MapPin },
    { href: "/trips", label: "Поездки", icon: Calendar },
    { href: "/social-feed", label: "Лента", icon: Users },
  ];

  const secondaryNavItems = [
    { href: "/events", label: "События" },
    { href: "/chat", label: "Чат" },
    { href: "/friends", label: "Друзья" },
  ];

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/20 backdrop-blur supports-[backdrop-filter]:bg-background/10">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--ait-sand)_85%,white)_0%,rgba(255,106,61,0.62)_36%,rgba(14,165,164,0.46)_72%,transparent_100%)] shadow-[0_0_0_1px_rgba(0,0,0,0.10)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10)]" />
          <span className="text-xl font-bold text-foreground">All In Travel</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {primaryNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "default" : "ghost"}
                className={location === item.href ? "bg-primary hover:bg-primary/90 gap-2" : "gap-2"}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Ещё
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <DropdownMenuItem>{item.label}</DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Right side actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => i18n.changeLanguage(i18n.language === "ru" ? "en" : "ru")}
          >
            {i18n.language === "ru" ? "EN" : "RU"}
          </Button>
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {!notifications?.items?.length ? (
                <DropdownMenuItem disabled>Нет новых уведомлений</DropdownMenuItem>
              ) : (
                notifications.items.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.type === "friend_request" ? "/friends" : `/messages?with=${item.id}`}>
                    <DropdownMenuItem onClick={() => setNotifOpen(false)}>
                      {item.message}
                    </DropdownMenuItem>
                  </Link>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/messages">
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || user?.email?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/20 backdrop-blur">
          <nav className="container py-4 space-y-2">
            {primaryNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    location === item.href ? "bg-primary hover:bg-primary/90" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}

            <div className="pt-2 mt-2 border-t border-border">
              <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">Ещё</p>
              <div className="space-y-1">
                {secondaryNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        location === item.href ? "bg-primary hover:bg-primary/90" : ""
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || user?.email?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(false)}>
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export { NavigationHeader };
export default NavigationHeader;