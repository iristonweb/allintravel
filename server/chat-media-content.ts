const MEDIA_TOKEN_RE =
  /\[(gif|sticker|image|video|audio|voice):([^\]]+)\]/g;

const ALLOWED_HOSTS = [
  "public.blob.vercel-storage.com",
  "blob.vercel-storage.com",
  "media.giphy.com",
  "i.giphy.com",
  "giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

export function isSafeServerMediaUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith("/stickers/")) return true;
  if (url.startsWith("/api/media/blob?")) return true;
  if (!process.env.VERCEL && url.startsWith("/uploads/")) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") {
      return hostAllowed(parsed.hostname);
    }
    return false;
  } catch {
    return false;
  }
}

function extractMediaUrls(content: string): string[] {
  const urls: string[] = [];
  const re = new RegExp(MEDIA_TOKEN_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const kind = match[1];
    const inner = match[2];
    if (kind === "voice") {
      const pipeIdx = inner.lastIndexOf("|");
      urls.push(pipeIdx === -1 ? inner : inner.slice(0, pipeIdx));
    } else {
      urls.push(inner);
    }
  }
  return urls;
}

export function validateChatMessageMediaContent(content: string): string | null {
  const urls = extractMediaUrls(content);
  for (const url of urls) {
    if (!isSafeServerMediaUrl(url)) {
      return "Недопустимый URL медиа в сообщении";
    }
  }
  return null;
}
