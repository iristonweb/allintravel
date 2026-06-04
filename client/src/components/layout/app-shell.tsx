import AppTopNav from "@/components/layout/app-top-nav";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AmbientBackground from "@/components/premium/AmbientBackground";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

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

  return (
    <AmbientBackground showOrbs={!immersive}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        <div
          className={cn(
            "flex-1",
            !immersive && "pt-20",
            immersive && "pt-0",
            isAuthenticated && !immersive && "pb-24 md:pb-8",
            isAuthenticated && immersive && "pb-24 md:pb-0",
            className,
          )}
        >
          <main
            className={cn(
              !fullWidth && !immersive && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
              (fullWidth || immersive) && "w-full",
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
