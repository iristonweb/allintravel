import { createElement, Fragment, type ReactNode } from "react";

/** WhatsApp / Telegram-style inline markers (longest match first when parsing) */
export const RICH_TEXT_MARKERS = {
  spoiler: ["||", "||"],
  underline: ["__", "__"],
  bold: ["*", "*"],
  italic: ["_", "_"],
  code: ["`", "`"],
  strike: ["~", "~"],
} as const;

export type RichTextFormat = keyof typeof RICH_TEXT_MARKERS;

const MARKER_PARSE_ORDER: RichTextFormat[] = [
  "spoiler",
  "underline",
  "code",
  "bold",
  "strike",
  "italic",
];

const URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?'")\]}>/]/g;

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
  for (const type of MARKER_PARSE_ORDER) {
    const [open, close] = RICH_TEXT_MARKERS[type];
    const index = text.indexOf(open);
    if (index === -1) continue;
    const closeIndex = text.indexOf(close, index + open.length);
    if (closeIndex === -1) continue;
    if (closeIndex === index + open.length) continue;
    candidates.push({ index, open, close, type });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.index - b.index || b.open.length - a.open.length);
  return candidates[0]!;
}

function linkifyPlain(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let linkIdx = 0;
  const matches = Array.from(text.matchAll(URL_RE));
  for (const match of matches) {
    const idx = match.index ?? 0;
    if (idx > last) {
      nodes.push(text.slice(last, idx));
    }
    const href = match[0];
    nodes.push(
      createElement(
        "a",
        {
          key: `${keyPrefix}-lnk-${linkIdx++}`,
          href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-ait-purple underline underline-offset-2 break-all hover:opacity-90",
        },
        href,
      ),
    );
    last = idx + href.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? nodes : [text];
}

function renderStyled(type: RichTextFormat, children: ReactNode): ReactNode {
  switch (type) {
    case "bold":
      return createElement("strong", { className: "font-semibold" }, children);
    case "italic":
      return createElement("em", { className: "italic" }, children);
    case "underline":
      return createElement("u", { className: "underline underline-offset-2" }, children);
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
    case "spoiler":
      return createElement(
        "span",
        {
          className:
            "rounded px-1 bg-white/15 text-transparent hover:text-inherit transition-colors cursor-pointer",
          title: "Спойлер",
        },
        children,
      );
  }
}

function parseRichInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let part = 0;

  while (rest.length > 0) {
    const delim = findEarliestDelimiter(rest);
    if (!delim) {
      nodes.push(...linkifyPlain(rest, `${keyPrefix}-plain`));
      break;
    }
    if (delim.index > 0) {
      nodes.push(...linkifyPlain(rest.slice(0, delim.index), `${keyPrefix}-pre-${part}`));
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

function renderLine(line: string, keyPrefix: string): ReactNode {
  const quoteMatch = /^>\s?(.*)$/.exec(line);
  if (quoteMatch) {
    return createElement(
      "blockquote",
      {
        key: keyPrefix,
        className:
          "border-l-2 border-ait-purple/50 pl-3 my-1 text-muted-foreground italic",
      },
      createElement(Fragment, null, ...parseRichInline(quoteMatch[1] ?? "", `${keyPrefix}-q`)),
    );
  }
  return createElement(Fragment, { key: keyPrefix }, ...parseRichInline(line, keyPrefix));
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
        renderLine(line, `ln-${i}`),
      ),
    ),
  );
}

/** Plain-text preview stripping markup markers (for excerpts). */
export function stripRichMarkers(text: string): string {
  return text
    .replace(/\|\|([^|]+)\|\|/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~([^~]+)~/g, "$1")
    .replace(/^>\s?/gm, "");
}
