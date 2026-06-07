import { cn } from "@/lib/utils";

type ReplyQuoteProps = {
  username: string;
  preview: string;
  isOwn?: boolean;
  compact?: boolean;
  className?: string;
};

export default function ReplyQuote({
  username,
  preview,
  isOwn,
  compact,
  className,
}: ReplyQuoteProps) {
  return (
    <div
      className={cn(
        "border-l-2 pl-2 py-0.5",
        compact ? "text-[11px] mb-0.5" : "text-xs mb-1.5 max-w-[min(300px,85vw)]",
        isOwn ? "border-white/45" : "border-ait-purple/55",
        className,
      )}
    >
      <span
        className={cn("font-semibold block truncate", isOwn ? "text-white/90" : "text-ait-purple")}
      >
        {username}
      </span>
      <span
        className={cn("italic line-clamp-2", isOwn ? "text-white/75" : "text-muted-foreground")}
      >
        «{preview}»
      </span>
    </div>
  );
}
