import PublicHeader from "@/components/public-header";
import type { ReactNode } from "react";
import PremiumBackground from "@/components/premium/PremiumBackground";

type PublicLayoutProps = {
  children: ReactNode;
  navItems?: Array<{ href: string; label: string }>;
};

export default function PublicLayout({ children, navItems }: PublicLayoutProps) {
  return (
    <PremiumBackground>
      <div className="min-h-screen">
        <PublicHeader navItems={navItems} />
        {children}
      </div>
    </PremiumBackground>
  );
}

