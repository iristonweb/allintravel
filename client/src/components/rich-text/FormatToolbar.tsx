import { Bold, Code, Italic, Strikethrough } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { applyRichFormat, type RichTextFormat } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type FormatToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
};

const FORMATS: { id: RichTextFormat; icon: typeof Bold; title: string }[] = [
  { id: "bold", icon: Bold, title: "Жирный (*текст*)" },
  { id: "italic", icon: Italic, title: "Курсив (_текст_)" },
  { id: "code", icon: Code, title: "Моно (`текст`)" },
  { id: "strike", icon: Strikethrough, title: "Зачёркнутый (~текст~)" },
];

export default function FormatToolbar({
  value,
  onChange,
  inputRef,
  disabled,
  className,
  compact,
}: FormatToolbarProps) {
  const apply = (format: RichTextFormat) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { next, selectionStart, selectionEnd } = applyRichFormat(value, start, end, format);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        compact ? "px-0.5" : "px-1 py-0.5 rounded-lg bg-white/5 border border-white/10",
        className,
      )}
    >
      {FORMATS.map(({ id, icon: Icon, title }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="icon"
          className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
          disabled={disabled}
          title={title}
          onClick={() => apply(id)}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
}
