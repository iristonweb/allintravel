import AppTopNav from "@/components/layout/app-top-nav";
import FeatureFooter from "@/components/marketing/feature-footer";
import AmbientBackground from "@/components/premium/AmbientBackground";
import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AmbientBackground showOrbs={false}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        <div className="flex-1 pt-20">{children}</div>
        <FeatureFooter showAnchors />
      </div>
    </AmbientBackground>
  );
}
