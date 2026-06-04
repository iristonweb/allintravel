import AppShell from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  fullWidth?: boolean;
};

export default function AppLayout({ children, contentClassName, fullWidth }: AppLayoutProps) {
  return (
    <AppShell fullWidth={fullWidth} contentClassName={contentClassName}>
      {children}
    </AppShell>
  );
}
