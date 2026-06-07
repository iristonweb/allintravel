import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Menu, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { AppNotification } from "@shared/notification-types";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/brand/brand-logo";
import { GuestAnchorLink } from "@/components/nav/guest-anchor-link";
import {
  guestAnchors,
  sidebarDiscoverNav,
  sidebarPrimaryNav,
  scrollToAnchor,
} from "@/lib/nav-config";
import AvatarHubMenu from "@/components/layout/avatar-hub-menu";
import WalletHeaderButton from "@/components/layout/wallet-header-button";
import HeaderQuickActions from "@/components/layout/header-quick-actions";
import AitBalancePill from "@/components/ait/AitBalancePill";

const pageTitles: Record<string, string> = {
  "/": "Главная",
  "/map": "Карта",
  "/trips": "Поездки",
  "/social-feed": "Сообщество",
  "/friends": "Друзья",
  "/messages": "Сообщения",
  "/profile": "Профиль",
  "/profile/music": "Моя музыка",
  "/music": "Моя музыка",
  "/places": "Места",
  "/events": "События",
  "/blog": "Блог",
  "/wallet": "AIT Hub",
  "/chat": "Чаты",
  "/admin": "Админ",
  "/profile/edit": "Редактирование",
  "/profile/settings": "Настройки",
};

function resolvePageTitle(path: string): string | null {
  if (pageTitles[path]) return pageTitles[path];
  const base = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
  return pageTitles[base] ?? null;
}

type AppTopNavProps = {
  minimalChrome?: boolean;
};

export default function AppTopNav({ minimalChrome }: AppTopNavProps) {
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
    unreadItems.length +
      (notifications?.friendRequests ?? 0) +
      (notifications?.unreadMessages ?? 0);
  const friendRequestCount = notifications?.friendRequests ?? 0;
  const unreadMessageCount = notifications?.unreadMessages ?? 0;
  const hasUnreadBadge = notifCount > 0 || unreadMessageCount > 0;

  const markReadAndGo = async (item: AppNotification) => {
    try {
      await apiRequest("PUT", `/api/notifications/${item.id}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch {
      /* ignore */
    }
    if (item.link) window.location.href = item.link;
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/profile") return location === "/profile";
    return location === href || location.startsWith(`${href}/`);
  };

  const pageTitle = resolvePageTitle(location);

  if (!isAuthenticated) {
    return (
      <header
        className={cn(
          "fixed top-0 z-50 w-full h-20",
          minimalChrome ? "ait-chrome-minimal-nav" : "ait-glass-nav",
        )}
      >
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
  ].filter((section) => section.items.length > 0);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full h-20 overflow-visible",
        minimalChrome ? "ait-chrome-minimal-nav" : "ait-glass-nav",
      )}
    >
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

        {pageTitle && !minimalChrome && (
          <p className="hidden md:block flex-1 min-w-0 text-sm font-medium text-slate-300 truncate pl-1">
            {pageTitle}
          </p>
        )}

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          {user?.isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 text-xs h-8"
              asChild
            >
              <Link href="/admin">
                <Shield className="h-3.5 w-3.5" />
                Админ
              </Link>
            </Button>
          )}

          <AitBalancePill className="hidden sm:inline-flex" />

          <HeaderQuickActions
            unreadItems={unreadItems}
            notifCount={notifCount}
            friendRequestCount={friendRequestCount}
            unreadMessageCount={unreadMessageCount}
            onMarkReadAndGo={markReadAndGo}
          />

          <WalletHeaderButton />

          <AvatarHubMenu user={user ?? null} hasUnreadBadge={hasUnreadBadge} />

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
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "w-full inline-flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white/8 hover:text-white",
                    isActive(item.href) && "ait-nav-active text-white bg-white/10",
                  )}
                >
                  {item.label}
                  {item.href === "/wallet" && (
                    <span className="ml-auto text-[10px] font-bold text-ait-orange">AIT</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </motion.nav>
      )}
    </header>
  );
}
