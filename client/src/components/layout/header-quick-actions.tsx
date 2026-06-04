import { Link } from "wouter";
import { Bell, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { AppNotification } from "@shared/notification-types";
import { cn } from "@/lib/utils";

type HeaderQuickActionsProps = {
  unreadItems: AppNotification[];
  notifCount: number;
  friendRequestCount: number;
  unreadMessageCount: number;
  onMarkReadAndGo: (item: AppNotification) => void;
  className?: string;
};

export default function HeaderQuickActions({
  unreadItems,
  notifCount,
  friendRequestCount,
  unreadMessageCount,
  onMarkReadAndGo,
  className,
}: HeaderQuickActionsProps) {
  return (
    <div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
      <Link href="/map" title="Карта и поиск мест">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Search className="h-5 w-5" />
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            title="Уведомления"
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="ait-glass-strong border-white/10 min-w-[300px] max-h-[70vh] overflow-y-auto"
        >
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
          <DropdownMenuItem asChild>
            <Link href="/friends" className="cursor-pointer flex items-center">
              Заявки в друзья
              {friendRequestCount > 0 && (
                <span className="ml-auto text-xs font-bold text-ait-orange">{friendRequestCount}</span>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/messages" className="cursor-pointer flex items-center">
              Сообщения
              {unreadMessageCount > 0 && (
                <span className="ml-auto text-xs font-bold text-ait-orange">{unreadMessageCount}</span>
              )}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link href="/messages" title="Сообщения">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadMessageCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
          )}
        </Button>
      </Link>
    </div>
  );
}
