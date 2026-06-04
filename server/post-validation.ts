import { z } from "zod";
import { insertTravelPostSchema } from "@shared/schema";
import {
  defaultTitleForFormat,
  isVideoUrl,
  postFormatSchema,
  type PostFormat,
} from "@shared/post-formats";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export function parseCreateTravelPostBody(body: unknown, userId: string) {
  const base = insertTravelPostSchema.parse({ ...(body as object), userId });
  const format = postFormatSchema.parse((body as { format?: string })?.format ?? "post") as PostFormat;
  const images = base.images ?? [];
  const content = (base.content ?? "").trim();
  const title = (base.title ?? "").trim() || defaultTitleForFormat(format);

  if (format === "story") {
    if (!images.length) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["images"],
          message: "Story requires at least one image or video",
        },
      ]);
    }
    return {
      ...base,
      format,
      title,
      content: content || " ",
      expiresAt: new Date(Date.now() + STORY_TTL_MS),
    };
  }

  if (format === "reel") {
    if (!images.some(isVideoUrl)) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["images"],
          message: "Reel requires a video file",
        },
      ]);
    }
    return { ...base, format, title, content: content || " " };
  }

  if (format === "journal") {
    if (content.length < 80) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["content"],
          message: "Journal entry should be at least 80 characters",
        },
      ]);
    }
    return {
      ...base,
      format,
      title,
      isPublic: base.isPublic ?? true,
    };
  }

  if (!title || title.length < 2) {
    throw new z.ZodError([
      { code: "custom", path: ["title"], message: "Title is required" },
    ]);
  }
  if (!content) {
    throw new z.ZodError([
      { code: "custom", path: ["content"], message: "Content is required" },
    ]);
  }

  return { ...base, format, title, content };
}
