import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ChatThreadShellProps = {
  header: ReactNode;
  topSlot?: ReactNode;
  scrollClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function ChatThreadShell({
  header,
  topSlot,
  scrollClassName,
  children,
  footer,
  className,
}: ChatThreadShellProps) {
  return (
    <div className={cn("flex flex-col flex-1 min-h-0 overflow-hidden", className)}>
      {topSlot}
      <div className="ait-chat-panel-header shrink-0 border-b border-white/5">{header}</div>
      <ScrollArea className={cn("flex-1 min-h-0", scrollClassName)}>{children}</ScrollArea>
      {footer ? (
        <div className="ait-chat-panel-header shrink-0 p-4 border-t border-white/5">{footer}</div>
      ) : null}
    </div>
  );
}

export function ChatComposerFooter({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="space-y-2">
      {hint}
      <div className="flex gap-2 items-center">{children}</div>
    </div>
  );
}
