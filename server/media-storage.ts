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
  return (
    pathname.startsWith("media/") ||
    pathname.startsWith("music/") ||
    pathname.startsWith("avatars/")
  );
}

/** True for URLs that will not survive Vercel redeploy (must not be saved to DB on Vercel). */
export function isEphemeralMediaUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith("data:")) return true;
  if (process.env.VERCEL && url.startsWith("/uploads/")) return true;
  return false;
}

/** Reject non-durable media URLs before writing to the database. */
export function assertPersistentMediaUrl(url: string): void {
  if (url.startsWith("data:")) {
    throw new Error(VERCEL_BLOB_REQUIRED_MSG);
  }
  if (process.env.VERCEL && url.startsWith("/uploads/")) {
    throw new Error(
      "На Vercel нельзя сохранять файлы в /uploads — подключите Vercel Blob (Dashboard → Storage → Blob → Connect to Project).",
    );
  }
}

export function logMediaStorageStatus(): void {
  if (process.env.VERCEL && !hasBlobStorage()) {
    console.error(
      "[media-storage] Vercel без Blob: загрузки аватаров и медиа будут падать. Подключите Blob store к проекту.",
    );
  } else if (hasBlobStorage()) {
    console.log("[media-storage] Vercel Blob активен — загрузки сохраняются постоянно.");
  }
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

/** User profile avatar — stored under avatars/{userId}/ in Blob or local uploads/. */
export async function persistUserAvatar(userId: string, file: Express.Multer.File): Promise<string> {
  const buffer = fileBuffer(file);
  const mime = file.mimetype || "application/octet-stream";
  const ext = guessExtension(mime, file.originalname);
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "") || "user";

  if (hasBlobStorage()) {
    const key = `avatars/${safeId}/${Date.now()}${ext}`;
    const url = await putBlobBuffer(key, buffer, mime);
    assertPersistentMediaUrl(url);
    return url;
  }

  if (!process.env.VERCEL) {
    const filename = `avatar-${safeId}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(getUploadsDir(), filename), buffer);
    return `/uploads/${filename}`;
  }

  throw new Error(VERCEL_BLOB_REQUIRED_MSG);
}

export function getUploadsStaticDir(): string {
  return getUploadsDir();
}
