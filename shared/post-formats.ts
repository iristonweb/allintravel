import { z } from "zod";

export const POST_FORMATS = ["post", "story", "reel", "journal"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];

export const postFormatSchema = z.enum(POST_FORMATS);

export function isVideoUrl(url: string): boolean {
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return true;
  if (url.includes("/video/")) return true;
  if (url.includes("/api/media/blob")) {
    try {
      const pathname = new URL(url, "http://local").searchParams.get("pathname") ?? "";
      if (/\.(mp4|webm|mov|m4v)$/i.test(pathname)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function defaultTitleForFormat(format: PostFormat): string {
  switch (format) {
    case "story":
      return "Story";
    case "reel":
      return "Reel";
    case "journal":
      return "Journal";
    default:
      return "Post";
  }
}
