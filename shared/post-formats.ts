import { z } from "zod";

export const POST_FORMATS = ["post", "story", "reel", "journal"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];

export const postFormatSchema = z.enum(POST_FORMATS);

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes("/video/");
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
