import { Link } from "wouter";
import { Bell, MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppNotification, NotificationFilter } from "@shared/notification-types";
import { cn } from "@/lib/utils";
import NotificationRow from "@/components/notifications/NotificationRow";
import NotificationCenterSheet from "@/components/notifications/NotificationCenterSheet";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const previewItems = unreadItems.slice(0, 7);

  return (
    <>
      <div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
        <Link href="/map" title="Карта и поиск мест">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Карта и поиск мест"
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
              aria-label="Уведомления"
            >
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="ait-glass-strong border-white/10 w-[min(360px,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto p-2"
          >
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Новые
            </p>
            {previewItems.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Нет новых уведомлений</p>
            ) : (
              previewItems.map((item) => (
                <div key={item.id} className="-mx-1">
                  <NotificationRow
                    item={item}
                    compact
                    onActivate={(n) => {
                      void onMarkReadAndGo(n);
                    }}
                  />
                </div>
              ))
            )}
            <DropdownMenuSeparator className="bg-white/10 my-2" />
            <DropdownMenuItem
              className="cursor-pointer justify-center font-medium text-ait-purple focus:text-white focus:bg-ait-purple/20"
              onSelect={() => setSheetOpen(true)}
            >
              Все уведомления
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/friends" className="cursor-pointer flex items-center">
                Заявки в друзья
                {friendRequestCount > 0 && (
                  <span className="ml-auto text-xs font-bold text-ait-orange">
                    {friendRequestCount}
                  </span>
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
            aria-label="Сообщения"
          >
            <MessageCircle className="h-5 w-5" />
            {unreadMessageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
            )}
          </Button>
        </Link>
      </div>

      <NotificationCenterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filter={filter}
        onFilterChange={setFilter}
      />
    </>
  );
}
