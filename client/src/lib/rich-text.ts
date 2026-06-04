import { createElement, Fragment, type ReactNode } from "react";

/** WhatsApp / Telegram-style inline markers */
export const RICH_TEXT_MARKERS = {
  bold: ["*", "*"],
  italic: ["_", "_"],
  code: ["`", "`"],
  strike: ["~", "~"],
} as const;

export type RichTextFormat = keyof typeof RICH_TEXT_MARKERS;

export function mergeTextAndMedia(text: string, mediaToken: string): string {
  const t = text.trim();
  const m = mediaToken.trim();
  if (!t) return m;
  if (!m) return t;
  return `${t}\n${m}`;
}

export function applyRichFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: RichTextFormat,
): { next: string; selectionStart: number; selectionEnd: number } {
  const [open, close] = RICH_TEXT_MARKERS[format];
  const selected = text.slice(selectionStart, selectionEnd);
  const inner = selected || "текст";
  const wrapped = `${open}${inner}${close}`;
  const next = text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd);
  return {
    next,
    selectionStart: selectionStart + open.length,
    selectionEnd: selectionStart + open.length + inner.length,
  };
}

type Delim = { index: number; open: string; close: string; type: RichTextFormat };

function findEarliestDelimiter(text: string): Delim | null {
  const candidates: Delim[] = [];
  for (const [type, [open, close]] of Object.entries(RICH_TEXT_MARKERS) as [
    RichTextFormat,
    readonly [string, string],
  ][]) {
    const index = text.indexOf(open);
    if (index === -1) continue;
    const closeIndex = text.indexOf(close, index + open.length);
    if (closeIndex === -1) continue;
    if (closeIndex === index + open.length) continue;
    candidates.push({ index, open, close, type });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0]!;
}

function renderStyled(type: RichTextFormat, children: ReactNode): ReactNode {
  switch (type) {
    case "bold":
      return createElement("strong", { className: "font-semibold" }, children);
    case "italic":
      return createElement("em", { className: "italic" }, children);
    case "code":
      return createElement(
        "code",
        {
          className:
            "rounded px-1 py-0.5 text-[0.92em] font-mono bg-black/25 text-violet-200",
        },
        children,
      );
    case "strike":
      return createElement("s", { className: "opacity-80" }, children);
  }
}

function parseRichInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let part = 0;

  while (rest.length > 0) {
    const delim = findEarliestDelimiter(rest);
    if (!delim) {
      nodes.push(rest);
      break;
    }
    if (delim.index > 0) {
      nodes.push(rest.slice(0, delim.index));
    }
    const innerStart = delim.index + delim.open.length;
    const innerEnd = rest.indexOf(delim.close, innerStart);
    const inner = rest.slice(innerStart, innerEnd);
    nodes.push(
      createElement(
        Fragment,
        { key: `${keyPrefix}-${part++}` },
        renderStyled(delim.type, parseRichInline(inner, `${keyPrefix}-${part}`)),
      ),
    );
    rest = rest.slice(innerEnd + delim.close.length);
  }

  return nodes;
}

/** Render messenger-style formatting in plain text segments. */
export function renderRichText(text: string): ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  if (lines.length === 1) {
    return createElement(Fragment, null, ...parseRichInline(text, "rt"));
  }
  return createElement(
    Fragment,
    null,
    ...lines.map((line, i) =>
      createElement(
        Fragment,
        { key: `ln-${i}` },
        i > 0 ? createElement("br") : null,
        ...parseRichInline(line, `ln-${i}`),
      ),
    ),
  );
}
