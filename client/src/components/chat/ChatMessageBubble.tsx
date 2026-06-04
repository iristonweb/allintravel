import { parseChatMessage, type ParsedChatMessage } from "@/lib/chat-message";
import ReplyQuote from "@/components/chat/ReplyQuote";
import { isSafeChatMediaUrl } from "@/lib/safe-media-url";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "wouter";
import MessageReactionBar from "@/components/chat/MessageReactionBar";
import MessageStatusTicks from "@/components/chat/MessageStatusTicks";
import type { MessageDeliveryStatus, ReactionSummary } from "@shared/schema";

const MENTION_LINK_RE = /@([a-zA-Z0-9_]{3,30})/g;

function renderTextWithMentions(text: string, isOwn: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_LINK_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const username = match[1];
    nodes.push(
      <Link
        key={`${match.index}-${username}`}
        href={`/u/${username}`}
        className={cn(
          "font-medium hover:underline",
          isOwn ? "text-white/95 underline-offset-2" : "text-ait-purple",
        )}
      >
        @{username}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : [text];
}

type ChatMessageBubbleProps = {
  content: string;
  isOwn: boolean;
  timestamp?: ReactNode;
  senderLabel?: ReactNode;
  edited?: boolean;
  reactions?: ReactionSummary[];
  onReact?: (emoji: string) => void;
  reacting?: boolean;
  deliveryStatus?: MessageDeliveryStatus;
  onDoubleClickReact?: () => void;
};

function safeUrl(url: string): string | undefined {
  const resolved = resolveMediaUrl(url) ?? url;
  return isSafeChatMediaUrl(resolved) ? resolved : undefined;
}

function MediaPart({ part }: { part: ParsedChatMessage }) {
  if (part.type === "text") return null;

  if (part.type === "gif" || part.type === "sticker") {
    const src = safeUrl(part.url);
    if (!src) return <span className="text-xs text-muted-foreground">[медиа]</span>;
    return (
      <img
        src={src}
        alt={part.type === "gif" ? "GIF" : ""}
        className={cn(
          "block bg-transparent",
          part.type === "gif"
            ? "ait-chat-gif max-w-[min(280px,78vw)] max-h-[240px] w-auto h-auto object-contain"
            : "ait-chat-sticker h-24 w-24 object-contain",
        )}
        loading="lazy"
        decoding="async"
      />
    );
  }

  if (part.type === "image") {
    const src = safeUrl(part.url);
    if (!src) return <span className="text-xs text-muted-foreground">[фото]</span>;
    return (
      <img
        src={src}
        alt="Фото"
        className="block max-w-[min(320px,85vw)] max-h-[360px] rounded-2xl object-cover"
        loading="lazy"
      />
    );
  }

  if (part.type === "video") {
    const src = safeUrl(part.url);
    if (!src) return <span className="text-xs text-muted-foreground">[видео]</span>;
    return (
      <video
        src={src}
        controls
        playsInline
        className="block max-w-[min(320px,85vw)] max-h-[360px] rounded-2xl bg-black/40"
      />
    );
  }

  if (part.type === "audio") {
    const src = safeUrl(part.url);
    if (!src) return <span className="text-xs text-muted-foreground">[аудио]</span>;
    return (
      <audio src={src} controls className="w-[min(280px,85vw)] h-10" preload="metadata" />
    );
  }

  if (part.type === "voice") {
    const src = safeUrl(part.url);
    if (!src) return <span className="text-xs text-muted-foreground">[голосовое]</span>;
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 min-w-[200px]">
        <audio src={src} controls className="h-8 flex-1 min-w-0" preload="metadata" />
        {part.durationSec > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0">{part.durationSec}с</span>
        )}
      </div>
    );
  }

  return null;
}

export default function ChatMessageBubble({
  content,
  isOwn,
  timestamp,
  senderLabel,
  edited,
  reactions = [],
  onReact,
  reacting,
  deliveryStatus,
  onDoubleClickReact,
}: ChatMessageBubbleProps) {
  const parts = parseChatMessage(content);
  const replyPart = parts.find((p): p is { type: "reply"; username: string; preview: string } => p.type === "reply");
  const mediaParts = parts.filter((p) => p.type !== "text" && p.type !== "reply");
  const textContent = parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  const bubbleBody = (
    <>
      {replyPart && (
        <ReplyQuote username={replyPart.username} preview={replyPart.preview} isOwn={isOwn} />
      )}
      {mediaParts.map((part, i) => (
        <MediaPart key={`m-${i}`} part={part} />
      ))}
      {textContent.trim() ? (
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm break-words max-w-[min(320px,85vw)] select-none",
            isOwn
              ? "ait-chat-bubble-own text-white rounded-tr-md"
              : "ait-chat-bubble-other text-foreground rounded-tl-md",
          )}
        >
          {renderTextWithMentions(textContent, isOwn)}
        </div>
      ) : null}
    </>
  );

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", isOwn ? "items-end" : "items-start")}>
      {senderLabel}

      {onDoubleClickReact ? (
        <div
          className="flex flex-col gap-1.5 cursor-default"
          onDoubleClick={(e) => {
            e.preventDefault();
            onDoubleClickReact();
          }}
        >
          {bubbleBody}
        </div>
      ) : (
        bubbleBody
      )}

      {reactions.length > 0 && (
        <MessageReactionBar
          reactions={reactions}
          onToggle={onReact}
          disabled={reacting}
          className={isOwn ? "justify-end" : "justify-start"}
        />
      )}

      <div className={cn("flex items-center gap-1.5 px-1", isOwn && "flex-row-reverse")}>
        {timestamp}
        {edited && (
          <span className="text-[10px] text-muted-foreground italic">изменено</span>
        )}
        {isOwn && deliveryStatus && <MessageStatusTicks status={deliveryStatus} />}
      </div>
    </div>
  );
}
