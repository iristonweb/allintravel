import AppShell, { type AppShellLayout } from "@/components/layout/app-shell";
import type { ThreeColumnMaxWidth } from "@/components/layout/three-column-layout";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  fullWidth?: boolean;
  immersive?: boolean;
  chrome?: "default" | "minimal";
  layout?: AppShellLayout;
  rightRail?: ReactNode;
  rightRailSticky?: boolean;
  columnMaxWidth?: ThreeColumnMaxWidth;
};

export default function AppLayout({
  children,
  contentClassName,
  fullWidth,
  immersive,
  chrome,
  layout,
  rightRail,
  rightRailSticky,
  columnMaxWidth,
}: AppLayoutProps) {
  return (
    <AppShell
      fullWidth={fullWidth}
      immersive={immersive}
      chrome={chrome}
      layout={layout}
      rightRail={rightRail}
      rightRailSticky={rightRailSticky}
      columnMaxWidth={columnMaxWidth}
      contentClassName={contentClassName}
    >
      {children}
    </AppShell>
  );
}
