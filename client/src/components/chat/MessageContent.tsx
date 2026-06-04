import { compactMessageLabel, parseChatMessage } from "@/lib/chat-message";
import { isSafeChatMediaUrl } from "@/lib/safe-media-url";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { cn } from "@/lib/utils";

type MessageContentProps = {
  content: string;
  className?: string;
  compact?: boolean;
};

function safeUrl(url: string): string | undefined {
  const resolved = resolveMediaUrl(url) ?? url;
  return isSafeChatMediaUrl(resolved) ? resolved : undefined;
}

export default function MessageContent({ content, className, compact }: MessageContentProps) {
  if (compact) {
    const label = compactMessageLabel(content);
    if (label) return <span className={cn("break-words", className)}>{label}</span>;
  }

  const parts = parseChatMessage(content);

  return (
    <span className={cn("break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return part.text ? <span key={i}>{part.text}</span> : null;
        }

        const src = "url" in part ? safeUrl(part.url) : undefined;
        if (!src) return <span key={i}>[медиа]</span>;

        if (part.type === "gif") {
          return (
            <img
              key={i}
              src={src}
              alt="GIF"
              className="ait-chat-gif max-w-[min(280px,78vw)] max-h-[240px] object-contain bg-transparent block"
              loading="lazy"
            />
          );
        }
        if (part.type === "sticker") {
          return (
            <img
              key={i}
              src={src}
              alt=""
              className="ait-chat-sticker h-24 w-24 object-contain bg-transparent block"
              loading="lazy"
            />
          );
        }
        if (part.type === "image") {
          return (
            <img
              key={i}
              src={src}
              alt="Фото"
              className="block max-w-[min(280px,78vw)] max-h-[240px] rounded-xl object-cover"
              loading="lazy"
            />
          );
        }
        if (part.type === "video") {
          return (
            <video
              key={i}
              src={src}
              controls
              playsInline
              className="block max-w-[min(280px,78vw)] max-h-[240px] rounded-xl"
            />
          );
        }
        if (part.type === "audio" || part.type === "voice") {
          return (
            <audio key={i} src={src} controls className="w-full max-w-[240px] h-8" preload="metadata" />
          );
        }
        return null;
      })}
    </span>
  );
}
