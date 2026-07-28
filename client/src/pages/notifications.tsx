import { useState } from "react";
import { useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitSurface from "@/components/ait-ui/AitSurface";
import NotificationList from "@/components/notifications/NotificationList";
import type { NotificationFilter } from "@shared/notification-types";
import { NOTIFICATION_FILTERS } from "@shared/notification-types";
import { useTranslation } from "react-i18next";

function parseFilter(raw: string | null): NotificationFilter {
  return (NOTIFICATION_FILTERS as readonly string[]).includes(raw ?? "")
    ? (raw as NotificationFilter)
    : "all";
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const search = useSearch();
  const initialFilter = parseFilter(new URLSearchParams(search).get("filter"));
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <ReelsPageLayout
          header={
            <AitSectionHeader
              title={t("notifications.page.title")}
              description={t("notifications.page.description")}
            />
          }
          feed={
            <AitSurface strong radius="xl" padding="sm" className="min-h-[60vh]">
              <NotificationList
                filter={filter}
                onFilterChange={setFilter}
                queryKeySuffix="page"
                listClassName="max-h-[calc(100vh-14rem)] pr-1"
              />
            </AitSurface>
          }
        />
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;
