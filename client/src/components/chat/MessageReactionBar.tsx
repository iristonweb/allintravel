import { cn } from "@/lib/utils";
import type { ReactionSummary } from "@shared/schema";

type MessageReactionBarProps = {
  reactions: ReactionSummary[];
  onToggle?: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function MessageReactionBar({
  reactions,
  onToggle,
  disabled,
  className,
}: MessageReactionBarProps) {
  if (!reactions.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={disabled || !onToggle}
          onClick={() => onToggle?.(r.emoji)}
          className={cn(
            "inline-flex items-center gap-0.5 text-[11px] rounded-full px-1.5 py-0.5 border transition-colors",
            r.reactedByMe
              ? "border-ait-orange/40 bg-ait-orange/15 text-ait-orange"
              : "border-border/60 bg-background/80 text-muted-foreground hover:border-ait-orange/30",
          )}
        >
          <span>{r.emoji}</span>
          {r.count > 1 ? <span>{r.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
