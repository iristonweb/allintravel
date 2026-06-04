import NavigationHeader from "@/components/navigation-header";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import PremiumBackground from "@/components/premium/PremiumBackground";

type AppLayoutProps = {
  children: ReactNode;
  /**
   * Main content wrapper classes.
   * Defaults to a standard container with vertical spacing.
   */
  contentClassName?: string;
};

export default function AppLayout({ children, contentClassName }: AppLayoutProps) {
  return (
    <PremiumBackground>
      <div className="min-h-screen">
        <NavigationHeader />
        <main className={cn("container mx-auto px-4 py-8", contentClassName)}>
          {children}
        </main>
      </div>
    </PremiumBackground>
  );
}

