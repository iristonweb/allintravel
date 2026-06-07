import { Link } from "wouter";
import { Bell, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatGroupSearchDialog } from "@/components/chat/ChatGroupSearchContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppNotification } from "@shared/notification-types";
import { cn } from "@/lib/utils";
import NotificationRow from "@/components/notifications/NotificationRow";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { open: openGroupSearch } = useChatGroupSearchDialog();
  const previewItems = unreadItems.slice(0, 7);

  return (
    <>
      <div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
          title="Поиск групп и мест"
          aria-label="Поиск"
          onClick={() => openGroupSearch()}
        >
          <Search className="h-5 w-5" />
        </Button>

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
              {t("notifications.new")}
            </p>
            {previewItems.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{t("notifications.empty")}</p>
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
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="cursor-pointer justify-center font-medium text-ait-purple focus:text-white focus:bg-ait-purple/20"
              >
                {t("notifications.viewAll")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/friends" className="cursor-pointer flex items-center">
                {t("notifications.friendRequests")}
                {friendRequestCount > 0 && (
                  <span className="ml-auto text-xs font-bold text-ait-orange">
                    {friendRequestCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/messages" title="Личные сообщения">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Личные сообщения"
          >
            <MessageCircle className="h-5 w-5" />
            {unreadMessageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
            )}
          </Button>
        </Link>
      </div>
    </>
  );
}
