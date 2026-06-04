import fs from "fs";
import path from "path";
import type { Express } from "express";
import { put } from "@vercel/blob";

const MAX_INLINE_IMAGE_BYTES = 3 * 1024 * 1024;

function resolveUploadsDir(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "ait-uploads");
  }
  return path.resolve(process.cwd(), "uploads");
}

let uploadsDir: string | null = null;

function getUploadsDir(): string {
  if (uploadsDir) return uploadsDir;
  uploadsDir = resolveUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function guessExtension(mime: string, originalName?: string): string {
  const fromName = originalName ? path.extname(originalName) : "";
  if (fromName) return fromName.toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
  };
  return map[mime] ?? ".bin";
}

function fileBuffer(file: Express.Multer.File): Buffer {
  if (file.buffer?.length) return file.buffer;
  if (file.path && fs.existsSync(file.path)) return fs.readFileSync(file.path);
  throw new Error("Empty upload");
}

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Persist upload and return a URL usable in DB and <img src> */
export async function persistUploadedFile(file: Express.Multer.File): Promise<string> {
  const buffer = fileBuffer(file);
  const mime = file.mimetype || "application/octet-stream";
  const ext = guessExtension(mime, file.originalname);

  if (hasBlobStorage()) {
    const key = `media/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const blob = await put(key, buffer, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (!process.env.VERCEL) {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    fs.writeFileSync(path.join(getUploadsDir(), filename), buffer);
    return `/uploads/${filename}`;
  }

  if (mime.startsWith("image/") && buffer.length <= MAX_INLINE_IMAGE_BYTES) {
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }

  throw new Error(
    "Загрузка на Vercel: подключите Vercel Blob (Storage → Blob) в проекте или используйте изображение до 3 МБ.",
  );
}

export function getUploadsStaticDir(): string {
  return getUploadsDir();
}
