import { parseChatMessage } from "@/lib/chat-message";
import { cn } from "@/lib/utils";

type MessageContentProps = {
  content: string;
  className?: string;
};

export default function MessageContent({ content, className }: MessageContentProps) {
  const parts = parseChatMessage(content);

  return (
    <span className={cn("break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "gif") {
          return (
            <img
              key={i}
              src={part.url}
              alt="GIF"
              className="max-w-[220px] max-h-[180px] rounded-lg mt-1 block"
              loading="lazy"
            />
          );
        }
        if (part.type === "sticker") {
          return (
            <img
              key={i}
              src={part.url}
              alt=""
              className="h-24 w-24 object-contain mt-1 block"
              loading="lazy"
            />
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </span>
  );
}
