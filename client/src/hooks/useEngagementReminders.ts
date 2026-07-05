import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useAitDashboard } from "./useAit";
import { useAitRingLabels } from "./useAitRingLabels";
import { showAppNotificationToast } from "@/lib/app-notification-toast";
import { type ActivityRingId } from "@shared/ait";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "ait_engagement_reminder_at";
const SESSION_KEY = "ait_engagement_session_count";
const FIRST_DELAY_MS = 2 * 60 * 1000;
const COOLDOWN_MS = 4 * 60 * 60 * 1000;
const MAX_PER_SESSION = 2;

const RING_ORDER: ActivityRingId[] = ["voice", "story", "echo", "pulse"];

const RING_LINKS: Record<ActivityRingId, string> = {
  voice: "/chat",
  story: "/social-feed",
  echo: "/social-feed",
  pulse: "/",
};

const GENERIC_REMINDERS = [
  { key: "exploreMap", url: "/map" },
  { key: "checkChats", url: "/chat" },
  { key: "planTrip", url: "/trips" },
  { key: "socialFeed", url: "/social-feed" },
  { key: "wallet", url: "/wallet" },
  { key: "passport", url: "/passport" },
  { key: "events", url: "/events" },
  { key: "community", url: "/friends" },
] as const;

function canShowReminder(): boolean {
  const sessionCount = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
  if (sessionCount >= MAX_PER_SESSION) return false;
  const last = localStorage.getItem(STORAGE_KEY);
  if (last) {
    const elapsed = Date.now() - parseInt(last, 10);
    if (elapsed < COOLDOWN_MS) return false;
  }
  return true;
}

function markReminderShown() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
  const count = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
  sessionStorage.setItem(SESSION_KEY, String(count + 1));
}

export function useEngagementReminders() {
  const { isAuthenticated } = useAuth();
  const { data: aitData } = useAitDashboard(isAuthenticated);
  const ringLabels = useAitRingLabels();
  const { t } = useTranslation();
  const indexRef = useRef(0);
  const aitDataRef = useRef(aitData);
  const ringLabelsRef = useRef(ringLabels);
  const tRef = useRef(t);

  aitDataRef.current = aitData;
  ringLabelsRef.current = ringLabels;
  tRef.current = t;

  useEffect(() => {
    if (!isAuthenticated) return;

    const showReminder = () => {
      if (document.visibilityState !== "visible") return;
      if (!canShowReminder()) return;

      const rings = aitDataRef.current?.rings as
        | Record<ActivityRingId, { count: number; percent: number }>
        | undefined;
      const incomplete = rings ? RING_ORDER.filter((id) => (rings[id]?.percent ?? 0) < 100) : [];

      if (incomplete.length > 0 && incomplete[0]) {
        const ringId = incomplete[0];
        markReminderShown();
        showAppNotificationToast({
          title: tRef.current("engagement.reminders.ring.title", {
            ring: ringLabelsRef.current[ringId],
          }),
          body: tRef.current("engagement.reminders.ring.body"),
          url: RING_LINKS[ringId],
          playSound: false,
        });
        return;
      }

      const pick = GENERIC_REMINDERS[indexRef.current % GENERIC_REMINDERS.length]!;
      indexRef.current += 1;
      markReminderShown();
      showAppNotificationToast({
        title: tRef.current(`engagement.reminders.${pick.key}.title`),
        body: tRef.current(`engagement.reminders.${pick.key}.body`),
        url: pick.url,
        playSound: false,
      });
    };

    const timer = window.setTimeout(showReminder, FIRST_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);
}
