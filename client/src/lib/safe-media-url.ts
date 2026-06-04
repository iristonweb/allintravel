import { toApiUrl } from "@/lib/queryClient";

const ALLOWED_MEDIA_HOSTS = [
  "media.giphy.com",
  "i.giphy.com",
  "giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "public.blob.vercel-storage.com",
  "blob.vercel-storage.com",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_MEDIA_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

function getTrustedOrigins(): Set<string> {
  const origins = new Set<string>();
  if (typeof window !== "undefined") origins.add(window.location.origin);
  const apiBase =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_ORIGIN) || "";
  if (apiBase) {
    try {
      origins.add(new URL(apiBase.replace(/\/$/, "") + "/").origin);
    } catch {
      /* ignore invalid VITE_API_ORIGIN */
    }
  }
  return origins;
}

export function isAllowedMediaPath(pathname: string): boolean {
  return pathname.startsWith("/uploads/") || pathname.startsWith("/api/media/blob");
}

function isStickerPath(pathname: string): boolean {
  return pathname.startsWith("/stickers/");
}

function normalizeMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const viaApi = toApiUrl(url);
  if (viaApi.startsWith("http://") || viaApi.startsWith("https://")) return viaApi;
  if (typeof window !== "undefined") {
    return new URL(url, window.location.origin).href;
  }
  return url;
}

/** Only https URLs from trusted CDNs (Giphy, Vercel Blob, same-origin/API uploads). */
export function isSafeChatMediaUrl(url: string): boolean {
  if (!url?.trim()) return false;
  const raw = url.trim();

  if (isStickerPath(raw) || raw.startsWith("/stickers/")) return true;
  if (raw.startsWith("/api/media/blob")) return true;
  if (raw.startsWith("/uploads/")) return true;

  try {
    const parsed = new URL(normalizeMediaUrl(raw));
    const protocolOk = import.meta.env.PROD
      ? parsed.protocol === "https:"
      : parsed.protocol === "https:" || parsed.protocol === "http:";
    if (!protocolOk) return false;

    if (isStickerPath(parsed.pathname) || isAllowedMediaPath(parsed.pathname)) {
      return true;
    }

    if (getTrustedOrigins().has(parsed.origin) && isAllowedMediaPath(parsed.pathname)) {
      return true;
    }

    return hostAllowed(parsed.hostname);
  } catch {
    return false;
  }
}
