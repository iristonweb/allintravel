import AppTopNav from "@/components/layout/app-top-nav";
import FeatureFooter from "@/components/marketing/feature-footer";
import PremiumBackground from "@/components/premium/PremiumBackground";
import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <PremiumBackground enableVideo={false}>
      <div className="min-h-screen flex flex-col">
        <AppTopNav />
        <div className="flex-1">{children}</div>
        <FeatureFooter />
      </div>
    </PremiumBackground>
  );
}
