import fs from "fs";
import path from "path";
import type { Express } from "express";
import { put } from "@vercel/blob";

export const VERCEL_BLOB_REQUIRED_MSG =
  "Загрузка на Vercel требует Vercel Blob: Storage → Blob → Connect to Project (один store). Должны появиться BLOB_STORE_ID (OIDC) или BLOB_READ_WRITE_TOKEN. BLOB_WEBHOOK_PUBLIC_KEY — не для загрузок. После redeploy загрузки заработают. Лимит тела ~4.5 МБ.";

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

function isPrivateStoreError(message: string): boolean {
  return /private store|private access/i.test(message);
}

/** Vercel Blob via static token or OIDC (BLOB_STORE_ID + token on deploy). */
export function hasBlobStorage(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (!storeId) return false;
  if (process.env.VERCEL) return true;
  return Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());
}

export function blobDeliveryUrl(pathname: string): string {
  return `/api/media/blob?pathname=${encodeURIComponent(pathname)}`;
}

export function isValidBlobDeliveryPathname(pathname: string): boolean {
  if (!pathname || pathname.includes("..") || pathname.startsWith("/")) return false;
  return pathname.startsWith("media/") || pathname.startsWith("music/");
}

/** Upload buffer to Vercel Blob; auto-detects public vs private store. */
export async function putBlobBuffer(key: string, buffer: Buffer, mime: string): Promise<string> {
  const baseOpts = { contentType: mime, addRandomSuffix: false };
  const accessEnv = process.env.BLOB_ACCESS?.trim().toLowerCase();

  if (accessEnv === "private") {
    const blob = await put(key, buffer, { ...baseOpts, access: "private" });
    return blobDeliveryUrl(blob.pathname);
  }
  if (accessEnv === "public") {
    const blob = await put(key, buffer, { ...baseOpts, access: "public" });
    return blob.url;
  }

  try {
    const blob = await put(key, buffer, { ...baseOpts, access: "public" });
    return blob.url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!isPrivateStoreError(msg)) throw e;
    const blob = await put(key, buffer, { ...baseOpts, access: "private" });
    return blobDeliveryUrl(blob.pathname);
  }
}

/** Persist upload and return a URL usable in DB and <img src> */
export async function persistUploadedFile(file: Express.Multer.File): Promise<string> {
  const buffer = fileBuffer(file);
  const mime = file.mimetype || "application/octet-stream";
  const ext = guessExtension(mime, file.originalname);

  if (hasBlobStorage()) {
    const key = `media/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    return putBlobBuffer(key, buffer, mime);
  }

  if (!process.env.VERCEL) {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    fs.writeFileSync(path.join(getUploadsDir(), filename), buffer);
    return `/uploads/${filename}`;
  }

  throw new Error(VERCEL_BLOB_REQUIRED_MSG);
}

export function getUploadsStaticDir(): string {
  return getUploadsDir();
}
