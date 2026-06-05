import AppTopNav from "@/components/layout/app-top-nav";
import AppIconSidebar from "@/components/layout/app-icon-sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AmbientBackground from "@/components/premium/AmbientBackground";
import PremiumBackground from "@/components/premium/PremiumBackground";
import { PAGE_BG_SRC } from "@/lib/marketing-images";
import { useAuth } from "@/hooks/useAuth";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import AppShellPlayerPadding from "@/components/layout/app-shell-player-padding";
import BroadcastModal from "@/components/admin/BroadcastModal";
import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
  immersive?: boolean;
  chrome?: "default" | "minimal";
  className?: string;
  contentClassName?: string;
};

export default function AppShell({
  children,
  fullWidth,
  immersive,
  chrome = "default",
  className,
  contentClassName,
}: AppShellProps) {
  const { isAuthenticated } = useAuth();
  usePresenceHeartbeat();
  useRealtimeNotifications();
  const { supported: pushSupported, vapidReady, subscribe: subscribePush } = usePushNotifications();

  const minimalChrome = chrome === "minimal";
  const effectiveImmersive = immersive || minimalChrome;

  useEffect(() => {
    if (!isAuthenticated || !pushSupported || !vapidReady) return;
    if (Notification.permission === "granted") {
      subscribePush().catch(() => undefined);
    }
  }, [isAuthenticated, pushSupported, vapidReady, subscribePush]);

  const shell = (
    <div className="min-h-screen flex flex-col">
      <AppTopNav minimalChrome={minimalChrome} />
      {isAuthenticated && <AppIconSidebar minimalChrome={minimalChrome} />}
      <AppShellPlayerPadding
        className={cn(
          "flex-1",
          minimalChrome && "pt-[var(--ait-header-h,5rem)]",
          !minimalChrome && !effectiveImmersive && "pt-20",
          !minimalChrome && effectiveImmersive && "pt-0",
          isAuthenticated && !effectiveImmersive && "pb-24 md:pb-8",
          isAuthenticated && effectiveImmersive && "pb-24 md:pb-0",
          isAuthenticated && !minimalChrome && "md:pl-[72px]",
          className,
        )}
      >
        <main
          className={cn(
            !fullWidth && !effectiveImmersive && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
            (fullWidth || effectiveImmersive) && "w-full",
            isAuthenticated && effectiveImmersive && "md:pl-0",
            contentClassName,
          )}
        >
          {children}
        </main>
      </AppShellPlayerPadding>
      {isAuthenticated && <MobileBottomNav />}
      {isAuthenticated && <BroadcastModal />}
    </div>
  );

  if (effectiveImmersive) {
    return <AmbientBackground showOrbs={false} showNoise={false}>{shell}</AmbientBackground>;
  }

  return (
    <PremiumBackground enableVideo={false} imageSrc={PAGE_BG_SRC}>
      {shell}
    </PremiumBackground>
  );
}
