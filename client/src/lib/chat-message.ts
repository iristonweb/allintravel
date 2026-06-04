export type ParsedChatMessage =
  | { type: "text"; text: string }
  | { type: "reply"; username: string; preview: string }
  | { type: "gif"; url: string }
  | { type: "sticker"; url: string }
  | { type: "image"; url: string }
  | { type: "video"; url: string }
  | { type: "audio"; url: string }
  | { type: "voice"; url: string; durationSec: number };

const REPLY_PREFIX = "[reply:";
const GIF_PREFIX = "[gif:";
const STICKER_PREFIX = "[sticker:";
const IMAGE_PREFIX = "[image:";
const VIDEO_PREFIX = "[video:";
const AUDIO_PREFIX = "[audio:";
const VOICE_PREFIX = "[voice:";

const SPECIAL_PREFIXES = [
  REPLY_PREFIX,
  GIF_PREFIX,
  STICKER_PREFIX,
  IMAGE_PREFIX,
  VIDEO_PREFIX,
  AUDIO_PREFIX,
  VOICE_PREFIX,
] as const;

export function encodeGifMessage(url: string): string {
  return `${GIF_PREFIX}${url}]`;
}

export function encodeStickerMessage(url: string): string {
  return `${STICKER_PREFIX}${url}]`;
}

export function encodeImageMessage(url: string): string {
  return `${IMAGE_PREFIX}${url}]`;
}

export function encodeVideoMessage(url: string): string {
  return `${VIDEO_PREFIX}${url}]`;
}

export function encodeAudioMessage(url: string): string {
  return `${AUDIO_PREFIX}${url}]`;
}

export function encodeVoiceMessage(url: string, durationSec: number): string {
  return `${VOICE_PREFIX}${url}|${Math.max(0, Math.round(durationSec))}]`;
}

export function encodeReplyBlock(username: string, preview: string, body: string): string {
  const trimmed = body.trim();
  if (!trimmed || !username) return trimmed;
  const user = username.startsWith("@") ? username : `@${username}`;
  const safePreview = preview.replace(/\]/g, "").trim().slice(0, 200) || "…";
  return `${REPLY_PREFIX}${user}|${safePreview}]${trimmed}`;
}

function findNextSpecialIndex(text: string): number {
  let min = -1;
  for (const prefix of SPECIAL_PREFIXES) {
    const idx = text.indexOf(prefix);
    if (idx === -1) continue;
    if (min === -1 || idx < min) min = idx;
  }
  return min;
}

function parseSpecialToken(rest: string): { part: ParsedChatMessage; consumed: number } | null {
  if (rest.startsWith(REPLY_PREFIX)) {
    const close = rest.indexOf("]", REPLY_PREFIX.length);
    if (close === -1) return null;
    const inner = rest.slice(REPLY_PREFIX.length, close);
    const pipeIdx = inner.indexOf("|");
    if (pipeIdx === -1) return null;
    const username = inner.slice(0, pipeIdx).trim();
    const preview = inner.slice(pipeIdx + 1).trim();
    return { part: { type: "reply", username, preview }, consumed: close + 1 };
  }
  if (rest.startsWith(GIF_PREFIX)) {
    const close = rest.indexOf("]", GIF_PREFIX.length);
    if (close === -1) return null;
    const url = rest.slice(GIF_PREFIX.length, close);
    return { part: { type: "gif", url }, consumed: close + 1 };
  }
  if (rest.startsWith(STICKER_PREFIX)) {
    const close = rest.indexOf("]", STICKER_PREFIX.length);
    if (close === -1) return null;
    const url = rest.slice(STICKER_PREFIX.length, close);
    return { part: { type: "sticker", url }, consumed: close + 1 };
  }
  if (rest.startsWith(IMAGE_PREFIX)) {
    const close = rest.indexOf("]", IMAGE_PREFIX.length);
    if (close === -1) return null;
    const url = rest.slice(IMAGE_PREFIX.length, close);
    return { part: { type: "image", url }, consumed: close + 1 };
  }
  if (rest.startsWith(VIDEO_PREFIX)) {
    const close = rest.indexOf("]", VIDEO_PREFIX.length);
    if (close === -1) return null;
    const url = rest.slice(VIDEO_PREFIX.length, close);
    return { part: { type: "video", url }, consumed: close + 1 };
  }
  if (rest.startsWith(AUDIO_PREFIX)) {
    const close = rest.indexOf("]", AUDIO_PREFIX.length);
    if (close === -1) return null;
    const url = rest.slice(AUDIO_PREFIX.length, close);
    return { part: { type: "audio", url }, consumed: close + 1 };
  }
  if (rest.startsWith(VOICE_PREFIX)) {
    const close = rest.indexOf("]", VOICE_PREFIX.length);
    if (close === -1) return null;
    const inner = rest.slice(VOICE_PREFIX.length, close);
    const pipeIdx = inner.lastIndexOf("|");
    const url = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
    const durationSec =
      pipeIdx === -1 ? 0 : Number.parseInt(inner.slice(pipeIdx + 1), 10) || 0;
    return { part: { type: "voice", url, durationSec }, consumed: close + 1 };
  }
  return null;
}

export function parseChatMessage(content: string): ParsedChatMessage[] {
  const parts: ParsedChatMessage[] = [];
  let rest = content;

  while (rest.length > 0) {
    const nextSpecial = findNextSpecialIndex(rest);
    if (nextSpecial === -1) {
      if (rest) parts.push({ type: "text", text: rest });
      break;
    }

    if (nextSpecial > 0) {
      parts.push({ type: "text", text: rest.slice(0, nextSpecial) });
      rest = rest.slice(nextSpecial);
      continue;
    }

    const parsed = parseSpecialToken(rest);
    if (!parsed) {
      parts.push({ type: "text", text: rest });
      break;
    }
    if (parsed.part.type !== "text") {
      if (parsed.part.type === "reply") {
        parts.push(parsed.part);
      } else if ("url" in parsed.part && parsed.part.url) {
        parts.push(parsed.part);
      }
    }
    rest = rest.slice(parsed.consumed);
  }

  if (parts.length === 0) parts.push({ type: "text", text: content });
  return parts;
}

const MEDIA_TYPES = new Set(["gif", "sticker", "image", "video", "audio", "voice"]);

export function isRichChatMessage(content: string): boolean {
  return SPECIAL_PREFIXES.some((p) => content.includes(p));
}

export function hasMediaParts(content: string): boolean {
  return parseChatMessage(content).some((p) => MEDIA_TYPES.has(p.type));
}

export function isMediaOnlyMessage(content: string): boolean {
  const parts = parseChatMessage(content);
  return (
    parts.some((p) => MEDIA_TYPES.has(p.type)) &&
    parts.every((p) => p.type === "text" ? !p.text.trim() : true)
  );
}

export function compactMessageLabel(content: string): string | null {
  const parts = parseChatMessage(content);
  if (parts.some((p) => p.type === "voice")) return "Голосовое";
  if (parts.some((p) => p.type === "video")) return "Видео";
  if (parts.some((p) => p.type === "image")) return "Фото";
  if (parts.some((p) => p.type === "audio")) return "Аудио";
  if (parts.some((p) => p.type === "gif")) return "GIF";
  if (parts.some((p) => p.type === "sticker")) return "Стикер";
  return null;
}

export function messagePreview(content: string, maxLen = 80): string {
  const media = compactMessageLabel(content);
  const text = parseChatMessage(content)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
  const base = text || media || "Сообщение";
  return base.length > maxLen ? `${base.slice(0, maxLen)}…` : base;
}

/** @deprecated Use encodeReplyBlock for quoted replies */
export function withReplyMention(body: string, username: string | undefined): string {
  const trimmed = body.trim();
  if (!trimmed || !username) return trimmed;
  const mention = `@${username}`;
  if (trimmed.includes(mention)) return trimmed;
  return `${mention} ${trimmed}`;
}
