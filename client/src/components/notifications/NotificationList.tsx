import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type {
  AppNotification,
  NotificationFilter,
  NotificationsSummary,
} from "@shared/notification-types";
import { NOTIFICATION_FILTERS } from "@shared/notification-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import EmptyState from "@/components/empty-state";
import NotificationRow from "@/components/notifications/NotificationRow";
import { groupNotificationsByDay } from "@/lib/notification-ui";
import { markNotificationRead } from "@/lib/notification-actions";
import { useTranslation } from "react-i18next";

type NotificationListProps = {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  enabled?: boolean;
  queryKeySuffix?: string;
  onItemActivate?: (item: AppNotification) => void;
  className?: string;
  listClassName?: string;
  showMarkAll?: boolean;
};

async function fetchNotificationPage(
  filter: NotificationFilter,
  cursor?: string,
): Promise<NotificationsSummary> {
  const params = new URLSearchParams({ limit: "30", filter });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/notifications?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json() as Promise<NotificationsSummary>;
}

export default function NotificationList({
  filter,
  onFilterChange,
  enabled = true,
  queryKeySuffix = "list",
  onItemActivate,
  className,
  listClassName,
  showMarkAll = true,
}: NotificationListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const filterLabels: Record<NotificationFilter, string> = {
    all: t("notifications.filters.all"),
    social: t("notifications.filters.social"),
    messages: t("notifications.filters.messages"),
  };
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ["/api/notifications", queryKeySuffix, filter],
      queryFn: ({ pageParam }) => fetchNotificationPage(filter, pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      enabled,
    });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const onActivate = useCallback(
    (item: AppNotification) => {
      if (!item.isRead) markRead.mutate(item);
      onItemActivate?.(item);
    },
    [markRead, onItemActivate],
  );

  useEffect(() => {
    if (!enabled || !hasNextPage || isFetchingNextPage) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, hasNextPage, isFetchingNextPage, fetchNextPage, data]);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const groups = groupNotificationsByDay(allItems);

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div className="flex gap-1.5 flex-wrap">
          {NOTIFICATION_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === key
                  ? "bg-ait-purple/30 text-white border border-ait-purple/50"
                  : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10",
              )}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
        {showMarkAll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs text-ait-purple hover:text-white hover:bg-white/10"
            disabled={markAllRead.isPending || allItems.every((i) => i.isRead)}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {t("notifications.readAll")}
          </Button>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto min-h-0", listClassName)}>
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-ait-purple" />
          </div>
        )}

        {isError && (
          <EmptyState
            icon={Bell}
            title="Не удалось загрузить"
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Повторить
              </Button>
            }
          />
        )}

        {!isLoading && !isError && allItems.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Пока пусто"
            description="Здесь появятся лайки, комментарии и реакции — как в Instagram."
          />
        )}

        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {(group.items as AppNotification[]).map((item) => (
                <NotificationRow key={item.id} item={item} onActivate={onActivate} />
              ))}
            </div>
          </div>
        ))}

        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-ait-purple" />}
        </div>
      </div>
    </div>
  );
}
