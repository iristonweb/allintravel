import { Bold, Code, EyeOff, Italic, Quote, Strikethrough, Underline } from "lucide-react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
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

const FORMAT_IDS: { id: RichTextFormat; icon: typeof Bold }[] = [
  { id: "bold", icon: Bold },
  { id: "italic", icon: Italic },
  { id: "underline", icon: Underline },
  { id: "code", icon: Code },
  { id: "strike", icon: Strikethrough },
  { id: "spoiler", icon: EyeOff },
];

function applyBlockQuote(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  defaultQuote: string,
): { next: string; selectionStart: number; selectionEnd: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const lineStart = before.lastIndexOf("\n") + 1;
  const prefix = text.slice(lineStart, selectionStart);
  const block = selected || defaultQuote;
  const quoted = block
    .split("\n")
    .map((line) => (line.startsWith("> ") ? line : `> ${line}`))
    .join("\n");
  const next = text.slice(0, lineStart) + prefix + quoted + after;
  return {
    next,
    selectionStart: lineStart + prefix.length,
    selectionEnd: lineStart + prefix.length + quoted.length,
  };
}

export default function FormatToolbar({
  value,
  onChange,
  inputRef,
  disabled,
  className,
  compact,
}: FormatToolbarProps) {
  const { t } = useTranslation();

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

  const applyQuote = () => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { next, selectionStart, selectionEnd } = applyBlockQuote(
      value,
      start,
      end,
      t("richText.quoteDefault"),
    );
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 flex-wrap",
        compact ? "px-0.5" : "px-1 py-0.5 rounded-lg bg-white/5 border border-white/10",
        className,
      )}
    >
      {FORMAT_IDS.map(({ id, icon: Icon }) => {
        const title = t(`richText.${id}`);
        return (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="icon"
            className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
            disabled={disabled}
            title={title}
            aria-label={title}
            onClick={() => apply(id)}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
        disabled={disabled}
        title={t("richText.quote")}
        aria-label={t("richText.quote")}
        onClick={applyQuote}
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
