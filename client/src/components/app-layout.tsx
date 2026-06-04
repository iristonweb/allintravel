import AppShell from "@/components/layout/app-shell";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  fullWidth?: boolean;
  immersive?: boolean;
};

export default function AppLayout({
  children,
  contentClassName,
  fullWidth,
  immersive,
}: AppLayoutProps) {
  return (
    <AppShell
      fullWidth={fullWidth}
      immersive={immersive}
      contentClassName={contentClassName}
    >
      {children}
    </AppShell>
  );
}
