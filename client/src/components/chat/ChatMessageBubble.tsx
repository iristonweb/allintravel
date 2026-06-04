import { parseChatMessage } from "@/lib/chat-message";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ChatMessageBubbleProps = {
  content: string;
  isOwn: boolean;
  timestamp?: ReactNode;
  senderLabel?: ReactNode;
};

function MediaBlock({ url, kind }: { url: string; kind: "gif" | "sticker" }) {
  return (
    <img
      src={url}
      alt={kind === "gif" ? "GIF" : ""}
      className={cn(
        "block bg-transparent",
        kind === "gif"
          ? "ait-chat-gif max-w-[min(280px,78vw)] max-h-[240px] w-auto h-auto object-contain"
          : "ait-chat-sticker h-24 w-24 object-contain",
      )}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function ChatMessageBubble({
  content,
  isOwn,
  timestamp,
  senderLabel,
}: ChatMessageBubbleProps) {
  const parts = parseChatMessage(content);
  const mediaParts = parts.filter((p) => p.type === "gif" || p.type === "sticker");
  const textContent = parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", isOwn ? "items-end" : "items-start")}>
      {senderLabel}

      {mediaParts.map((part, i) => (
        <MediaBlock
          key={`m-${i}`}
          url={part.type === "gif" ? part.url : part.url}
          kind={part.type}
        />
      ))}

      {textContent.trim() ? (
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm break-words max-w-[min(320px,85vw)]",
            isOwn
              ? "ait-chat-bubble-own text-white rounded-tr-md"
              : "ait-chat-bubble-other text-foreground rounded-tl-md",
          )}
        >
          {textContent}
        </div>
      ) : null}

      {timestamp}
    </div>
  );
}
