import AppTopNav from "@/components/layout/app-top-nav";
import FeatureFooter from "@/components/marketing/feature-footer";
import AmbientBackground from "@/components/premium/AmbientBackground";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
};

export default function PublicLayout({ children, contentClassName }: PublicLayoutProps) {
  return (
    <AmbientBackground showOrbs={false}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        <div className={cn("flex-1 pt-[var(--ait-header-h,4.5rem)]", contentClassName)}>{children}</div>
        <FeatureFooter showAnchors />
      </div>
    </AmbientBackground>
  );
}
