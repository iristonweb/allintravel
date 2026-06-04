import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppShellPlayerPaddingProps = {
  children: ReactNode;
  className?: string;
};

export default function AppShellPlayerPadding({ children, className }: AppShellPlayerPaddingProps) {
  const { isPlayerVisible, playerUi } = useMusicPlayer();

  return (
    <div
      className={cn(
        className,
        isPlayerVisible && playerUi === "expanded" && "max-md:pb-8 md:pb-4",
        isPlayerVisible && playerUi === "collapsed" && "max-md:pb-4 md:pb-2",
      )}
    >
      {children}
    </div>
  );
}
