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

/** Only https URLs from trusted CDNs (Giphy, Vercel Blob, same-origin uploads). */
export function isSafeChatMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
      return parsed.pathname.startsWith("/uploads/");
    }
    return hostAllowed(parsed.hostname);
  } catch {
    return false;
  }
}
