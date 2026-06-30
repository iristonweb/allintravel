import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Menu, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { AppNotification } from "@shared/notification-types";
import { markNotificationRead } from "@/lib/notification-actions";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/brand/brand-logo";
import { GuestAnchorLink } from "@/components/nav/guest-anchor-link";
import { scrollToAnchor } from "@/lib/nav-config";
import { useNavLabels } from "@/hooks/useNavLabels";
import { isNavActive } from "@/lib/nav-groups";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import AvatarHubMenu from "@/components/layout/avatar-hub-menu";
import WalletHeaderButton from "@/components/layout/wallet-header-button";
import HeaderQuickActions from "@/components/layout/header-quick-actions";
import AitBalancePill from "@/components/ait/AitBalancePill";
import { toApiUrl } from "@/lib/queryClient";

function resolvePageTitle(path: string, titles: Record<string, string>): string | null {
  if (path.startsWith("/messages")) return titles["/chat"] ?? null;
  if (titles[path]) return titles[path];
  const base = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
  return titles[base] ?? null;
}

type AppTopNavProps = {
  minimalChrome?: boolean;
};

const EMPTY_NOTIFICATIONS = {
  friendRequests: 0,
  unreadMessages: 0,
  totalUnread: 0,
  items: [] as AppNotification[],
};

export default function AppTopNav({ minimalChrome }: AppTopNavProps) {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { guestAnchors, navGroups, pageTitles: navPageTitles } = useNavLabels();

  const queryClient = useQueryClient();

  const { data: notifications } = useQuery<{
    friendRequests: number;
    unreadMessages: number;
    totalUnread?: number;
    items: AppNotification[];
  }>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch(toApiUrl("/api/notifications"), { credentials: "include" });
      if (!res.ok) return EMPTY_NOTIFICATIONS;
      return res.json() as Promise<typeof EMPTY_NOTIFICATIONS>;
    },
    enabled: isAuthenticated,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
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
      await markNotificationRead(item);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch {
      /* ignore */
    }
    if (item.link) navigate(item.link);
  };

  const pageTitle = resolvePageTitle(location, navPageTitles);

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
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link href="/login">
            <Button variant="premium" className="shrink-0 px-6">
              {t("nav.login")}
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  const menuSections = navGroups.map((group) => ({
    title: group.label,
    items: group.items.map(({ href, label }) => ({ href, label })),
  }));

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

          <LanguageSwitcher />

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
              {section.items.map((item) => {
                const active = isNavActive(location, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "w-full inline-flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white/8 hover:text-white",
                      active && "ait-nav-active text-white bg-white/10",
                    )}
                  >
                    {item.label}
                    {item.href === "/wallet" && (
                      <span className="ml-auto text-[10px] font-bold text-ait-orange">AIT</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </motion.nav>
      )}
    </header>
  );
}
