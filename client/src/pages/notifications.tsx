import { useState } from "react";
import { useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import NotificationList from "@/components/notifications/NotificationList";
import type { NotificationFilter } from "@shared/notification-types";
import { NOTIFICATION_FILTERS } from "@shared/notification-types";

function parseFilter(raw: string | null): NotificationFilter {
  return (NOTIFICATION_FILTERS as readonly string[]).includes(raw ?? "")
    ? (raw as NotificationFilter)
    : "all";
}

export function NotificationsPage() {
  const search = useSearch();
  const initialFilter = parseFilter(new URLSearchParams(search).get("filter"));
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <PageHeader title="Уведомления" description="Лайки, комментарии, реакции и сообщения" />
        <div className="mt-6 rounded-3xl border border-white/10 ait-glass-strong p-4 sm:p-5 min-h-[60vh]">
          <NotificationList
            filter={filter}
            onFilterChange={setFilter}
            queryKeySuffix="page"
            listClassName="max-h-[calc(100vh-14rem)] pr-1"
          />
        </div>
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;
