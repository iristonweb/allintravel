import AppTopNav from "@/components/layout/app-top-nav";
import AppIconSidebar from "@/components/layout/app-icon-sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AmbientBackground from "@/components/premium/AmbientBackground";
import { useAuth } from "@/hooks/useAuth";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useEngagementReminders } from "@/hooks/useEngagementReminders";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import AppShellPlayerPadding from "@/components/layout/app-shell-player-padding";
import BroadcastModal from "@/components/admin/BroadcastModal";
import ThreeColumnLayout from "@/components/layout/three-column-layout";
import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";
import type { ThreeColumnMaxWidth } from "@/components/layout/three-column-layout";

export type AppShellLayout = "default" | "immersive" | "full-bleed";

type AppShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
  immersive?: boolean;
  chrome?: "default" | "minimal";
  layout?: AppShellLayout;
  rightRail?: ReactNode;
  rightRailSticky?: boolean;
  columnMaxWidth?: ThreeColumnMaxWidth;
  className?: string;
  contentClassName?: string;
};

export default function AppShell({
  children,
  fullWidth,
  immersive,
  chrome = "default",
  layout = "default",
  rightRail,
  rightRailSticky,
  columnMaxWidth,
  className,
  contentClassName,
}: AppShellProps) {
  const { isAuthenticated } = useAuth();
  usePresenceHeartbeat();
  useRealtimeNotifications();
  useEngagementReminders();
  const { supported: pushSupported, vapidReady, subscribe: subscribePush } = usePushNotifications();

  const minimalChrome = chrome === "minimal";
  const effectiveImmersive =
    immersive || minimalChrome || layout === "immersive" || layout === "full-bleed";
  const effectiveFullWidth = fullWidth || layout === "full-bleed";

  useEffect(() => {
    if (!isAuthenticated || !pushSupported || !vapidReady) return;
    if (Notification.permission === "granted") {
      subscribePush().catch(() => undefined);
    }
  }, [isAuthenticated, pushSupported, vapidReady, subscribePush]);

  const mainContent = rightRail ? (
    <ThreeColumnLayout
      rightRail={rightRail}
      rightRailSticky={rightRailSticky}
      maxWidth={columnMaxWidth ?? (effectiveFullWidth ? "full" : "wide")}
    >
      {children}
    </ThreeColumnLayout>
  ) : (
    children
  );

  const shell = (
    <div className="min-h-screen flex flex-col">
      <AppTopNav minimalChrome={minimalChrome} />
      {isAuthenticated && <AppIconSidebar minimalChrome={minimalChrome} />}
      <AppShellPlayerPadding
        className={cn(
          "flex-1",
          minimalChrome && "pt-[var(--ait-header-h,4.5rem)]",
          !minimalChrome && !effectiveImmersive && "pt-[var(--ait-header-h,4.5rem)]",
          !minimalChrome && effectiveImmersive && layout !== "full-bleed" && "pt-0",
          layout === "full-bleed" && "pt-0",
          isAuthenticated && !effectiveImmersive && "pb-24 md:pb-8",
          isAuthenticated && effectiveImmersive && "pb-24 md:pb-0",
          isAuthenticated && !minimalChrome && "md:pl-[72px]",
          className,
        )}
      >
        <main
          className={cn(
            !effectiveFullWidth &&
              !effectiveImmersive &&
              !rightRail &&
              "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
            effectiveFullWidth && !rightRail && "w-full",
            effectiveImmersive && !rightRail && "w-full",
            (rightRail || effectiveFullWidth) && "py-8",
            isAuthenticated && effectiveImmersive && "md:pl-0",
            contentClassName,
          )}
        >
          {mainContent}
        </main>
      </AppShellPlayerPadding>
      {isAuthenticated && <MobileBottomNav />}
      {isAuthenticated && <BroadcastModal />}
    </div>
  );

  return (
    <AmbientBackground showOrbs={!effectiveImmersive} showNoise={!effectiveImmersive}>
      {shell}
    </AmbientBackground>
  );
}
