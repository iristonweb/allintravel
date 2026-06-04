import { parseChatMessage } from "@/lib/chat-message";
import { cn } from "@/lib/utils";

type MessageContentProps = {
  content: string;
  className?: string;
  /** Превью в списке диалогов — без крупных медиа */
  compact?: boolean;
};

export default function MessageContent({ content, className, compact }: MessageContentProps) {
  const parts = parseChatMessage(content);

  return (
    <span className={cn("break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "gif") {
          if (compact) return <span key={i}>GIF</span>;
          return (
            <img
              key={i}
              src={part.url}
              alt="GIF"
              className="ait-chat-gif max-w-[min(280px,78vw)] max-h-[240px] object-contain bg-transparent block"
              loading="lazy"
            />
          );
        }
        if (part.type === "sticker") {
          if (compact) return <span key={i}>Стикер</span>;
          return (
            <img
              key={i}
              src={part.url}
              alt=""
              className="ait-chat-sticker h-24 w-24 object-contain bg-transparent block"
              loading="lazy"
            />
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </span>
  );
}
