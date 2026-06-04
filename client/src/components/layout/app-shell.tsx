import AppTopNav from "@/components/layout/app-top-nav";
import AppIconSidebar from "@/components/layout/app-icon-sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import PremiumBackground from "@/components/premium/PremiumBackground";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
  hideSidebar?: boolean;
  className?: string;
  contentClassName?: string;
};

export default function AppShell({
  children,
  fullWidth,
  hideSidebar,
  className,
  contentClassName,
}: AppShellProps) {
  const { isAuthenticated } = useAuth();

  return (
    <PremiumBackground enableVideo={false} enableInteractive={!fullWidth}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        {isAuthenticated && !hideSidebar && <AppIconSidebar />}
        <div
          className={cn(
            "flex-1",
            isAuthenticated && !hideSidebar && "md:pl-[72px]",
            isAuthenticated && "pb-20 md:pb-0",
            className,
          )}
        >
          <main
            className={cn(
              !fullWidth && "container mx-auto px-4 py-6",
              fullWidth && "w-full px-0 py-0",
              contentClassName,
            )}
          >
            {children}
          </main>
        </div>
        {isAuthenticated && <MobileBottomNav />}
      </div>
    </PremiumBackground>
  );
}
