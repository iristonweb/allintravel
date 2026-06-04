import AppShell from "@/components/layout/app-shell";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  fullWidth?: boolean;
  immersive?: boolean;
  chrome?: "default" | "minimal";
};

export default function AppLayout({
  children,
  contentClassName,
  fullWidth,
  immersive,
  chrome,
}: AppLayoutProps) {
  return (
    <AppShell
      fullWidth={fullWidth}
      immersive={immersive}
      chrome={chrome}
      contentClassName={contentClassName}
    >
      {children}
    </AppShell>
  );
}
