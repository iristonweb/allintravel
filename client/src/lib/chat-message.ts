export type ParsedChatMessage =
  | { type: "text"; text: string }
  | { type: "gif"; url: string }
  | { type: "sticker"; url: string };

const GIF_PREFIX = "[gif:";
const STICKER_PREFIX = "[sticker:";

export function encodeGifMessage(url: string): string {
  return `${GIF_PREFIX}${url}]`;
}

export function encodeStickerMessage(url: string): string {
  return `${STICKER_PREFIX}${url}]`;
}

export function parseChatMessage(content: string): ParsedChatMessage[] {
  const parts: ParsedChatMessage[] = [];
  let rest = content;

  while (rest.length > 0) {
    const gifIdx = rest.indexOf(GIF_PREFIX);
    const stickerIdx = rest.indexOf(STICKER_PREFIX);
    const nextSpecial =
      gifIdx === -1
        ? stickerIdx
        : stickerIdx === -1
          ? gifIdx
          : Math.min(gifIdx, stickerIdx);

    if (nextSpecial === -1) {
      if (rest) parts.push({ type: "text", text: rest });
      break;
    }

    if (nextSpecial > 0) {
      parts.push({ type: "text", text: rest.slice(0, nextSpecial) });
      rest = rest.slice(nextSpecial);
      continue;
    }

    const isGif = rest.startsWith(GIF_PREFIX);
    const prefix = isGif ? GIF_PREFIX : STICKER_PREFIX;
    const close = rest.indexOf("]", prefix.length);
    if (close === -1) {
      parts.push({ type: "text", text: rest });
      break;
    }
    const url = rest.slice(prefix.length, close);
    if (url) {
      parts.push(isGif ? { type: "gif", url } : { type: "sticker", url });
    }
    rest = rest.slice(close + 1);
  }

  if (parts.length === 0) parts.push({ type: "text", text: content });
  return parts;
}

export function isRichChatMessage(content: string): boolean {
  return content.includes(GIF_PREFIX) || content.includes(STICKER_PREFIX);
}
