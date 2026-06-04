import { Link } from "wouter";
import {
  Bell,
  Search,
  MessageCircle,
  LogOut,
  Settings,
  Edit,
  User,
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
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { AppNotification } from "@shared/notification-types";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { profileHubLinksWithMap } from "@/lib/profile-hub-links";

type AvatarHubMenuProps = {
  user: {
    firstName?: string | null;
    profileImageUrl?: string | null;
  } | null;
  unreadItems: AppNotification[];
  notifCount: number;
  friendRequestCount: number;
  unreadMessageCount: number;
  hasUnreadBadge: boolean;
  onMarkReadAndGo: (item: AppNotification) => void;
  onLogout: () => void;
};

export default function AvatarHubMenu({
  user,
  unreadItems,
  notifCount,
  friendRequestCount,
  unreadMessageCount,
  hasUnreadBadge,
  onMarkReadAndGo,
  onLogout,
}: AvatarHubMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        if (window.matchMedia("(hover: hover)").matches) setOpen(true);
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) scheduleClose();
      }}
    >
      <Button
        type="button"
        variant="ghost"
        className="relative rounded-2xl p-1 h-11 w-11 hover:bg-white/8"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Меню профиля"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar className="h-9 w-9 border-2 border-white/20 ait-neon-purple">
          <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
          <AvatarFallback className="bg-gradient-to-br from-[#8b5cf6] to-[#ff7a18] text-xs text-white">
            {user?.firstName?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
        {hasUnreadBadge && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[59] md:hidden bg-black/20"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-full z-[60] pt-2",
              "w-[min(340px,calc(100vw-1.5rem))]",
            )}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <div className="rounded-2xl ait-glass-strong border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1 px-2 py-2 border-b border-white/10">
                <Link href="/map" title="Карта и поиск мест" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
                <NotificationsDropdown
                  unreadItems={unreadItems}
                  notifCount={notifCount}
                  friendRequestCount={friendRequestCount}
                  unreadMessageCount={unreadMessageCount}
                  onMarkReadAndGo={onMarkReadAndGo}
                />
                <Link href="/messages" title="Сообщения" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
                    )}
                  </Button>
                </Link>
              </div>

              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 px-1 mb-2">
                  Личный кабинет
                </p>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {profileHubLinksWithMap.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                      <span className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors cursor-pointer">
                        <item.icon className="h-4 w-4 shrink-0 text-ait-purple" />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[9px] font-bold text-ait-orange">{item.badge}</span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-2 flex flex-col gap-0.5">
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/8 cursor-pointer">
                      <User className="h-4 w-4" />
                      Профиль
                    </span>
                  </Link>
                  <Link href="/profile/edit" onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/8 cursor-pointer">
                      <Edit className="h-4 w-4" />
                      Редактировать
                    </span>
                  </Link>
                  <Link href="/profile/settings" onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/8 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Настройки
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/8 w-full text-left"
                    onClick={() => {
                      setOpen(false);
                      void onLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationsDropdown({
  unreadItems,
  notifCount,
  friendRequestCount,
  unreadMessageCount,
  onMarkReadAndGo,
}: {
  unreadItems: AppNotification[];
  notifCount: number;
  friendRequestCount: number;
  unreadMessageCount: number;
  onMarkReadAndGo: (item: AppNotification) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
          <Bell className="h-5 w-5" />
          {notifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
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
              onClick={() => void onMarkReadAndGo(item)}
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
  );
}
