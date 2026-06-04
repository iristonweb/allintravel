import AppTopNav from "@/components/layout/app-top-nav";
import FeatureFooter from "@/components/marketing/feature-footer";
import PremiumBackground from "@/components/premium/PremiumBackground";
import { RESORT_BG_SRC } from "@/lib/site-meta";
import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <PremiumBackground enableVideo={false} imageSrc={RESORT_BG_SRC}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        <div className="flex-1 pt-20">{children}</div>
        <FeatureFooter showAnchors />
      </div>
    </PremiumBackground>
  );
}
