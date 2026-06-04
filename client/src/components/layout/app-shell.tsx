import AppTopNav from "@/components/layout/app-top-nav";
import AppIconSidebar from "@/components/layout/app-icon-sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AmbientBackground from "@/components/premium/AmbientBackground";
import { useAuth } from "@/hooks/useAuth";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
  immersive?: boolean;
  className?: string;
  contentClassName?: string;
};

export default function AppShell({
  children,
  fullWidth,
  immersive,
  className,
  contentClassName,
}: AppShellProps) {
  const { isAuthenticated } = useAuth();
  usePresenceHeartbeat();
  useRealtimeNotifications();
  const { supported: pushSupported, vapidReady, subscribe: subscribePush } = usePushNotifications();

  useEffect(() => {
    if (!isAuthenticated || !pushSupported || !vapidReady) return;
    if (Notification.permission === "granted") {
      subscribePush().catch(() => undefined);
    }
  }, [isAuthenticated, pushSupported, vapidReady, subscribePush]);

  return (
    <AmbientBackground showOrbs={!immersive}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        {isAuthenticated && <AppIconSidebar />}
        <div
          className={cn(
            "flex-1",
            !immersive && "pt-20",
            immersive && "pt-0",
            isAuthenticated && !immersive && "pb-24 md:pb-8",
            isAuthenticated && immersive && "pb-24 md:pb-0",
            isAuthenticated && "md:pl-[72px]",
            className,
          )}
        >
          <main
            className={cn(
              !fullWidth && !immersive && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
              (fullWidth || immersive) && "w-full",
              isAuthenticated && immersive && "md:pl-0",
              contentClassName,
            )}
          >
            {children}
          </main>
        </div>
        {isAuthenticated && <MobileBottomNav />}
      </div>
    </AmbientBackground>
  );
}
