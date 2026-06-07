import { Readable } from "node:stream";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import multer, { MulterError } from "multer";
import { get } from "@vercel/blob";
import { getAuthUserId, isAuthenticated } from "./auth";
import { uploadLimiter } from "./rate-limit";
import { storage } from "./storage";
import {
  getUploadsStaticDir,
  isValidBlobDeliveryPathname,
  persistUploadedFile,
  persistUserAvatar,
  assertPersistentMediaUrl,
  logMediaStorageStatus,
  VERCEL_BLOB_REQUIRED_MSG,
} from "./media-storage";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "audio/mp3",
]);

function isAllowedMime(mime: string, originalName: string): boolean {
  if (ALLOWED_MIME.has(mime)) return true;
  const lower = originalName.toLowerCase();
  if (mime === "application/octet-stream") {
    if (lower.endsWith(".gif")) return true;
    if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) return true;
    if (
      lower.endsWith(".mp3") ||
      lower.endsWith(".m4a") ||
      lower.endsWith(".ogg") ||
      lower.endsWith(".wav") ||
      lower.endsWith(".webm")
    )
      return true;
  }
  return false;
}

export function createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (isAllowedMime(file.mimetype, file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error("Допустимы фото, видео MP4/WebM и аудио MP3/M4A/OGG/WAV"));
      }
    },
  });
}

export function handleMulter(
  req: Request,
  res: Response,
  next: NextFunction,
  middleware: ReturnType<ReturnType<typeof createUploadMiddleware>["single"]>,
) {
  middleware(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof MulterError) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? process.env.VERCEL
            ? "Файл слишком большой (на Vercel лимит ~4.5 МБ на один запрос)"
            : "Файл слишком большой (макс. 50 МБ)"
          : err.message;
      return res.status(400).json({ message: msg });
    }
    const message = err instanceof Error ? err.message : "Ошибка загрузки";
    return res.status(400).json({ message });
  });
}

export function mountUploadRoutes(app: Express, options?: { serveStatic?: boolean }): void {
  logMediaStorageStatus();
  const upload = createUploadMiddleware();
  const serveStatic = options?.serveStatic !== false;

  if (serveStatic) {
    const dir = getUploadsStaticDir();
    app.use("/uploads", express.static(dir));
  }

  app.get("/api/media/blob", async (req: Request, res: Response) => {
    const pathname = typeof req.query.pathname === "string" ? req.query.pathname : "";
    if (!isValidBlobDeliveryPathname(pathname)) {
      return res.status(400).json({ message: "Invalid pathname" });
    }
    try {
      const result = await get(pathname, { access: "private" });
      if (result?.statusCode !== 200 || !result.stream) {
        return res.status(404).end();
      }
      res.setHeader("Content-Type", result.blob.contentType);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=86400");
      Readable.fromWeb(result.stream as import("node:stream/web").ReadableStream).pipe(res);
    } catch (e) {
      console.error("[blob-delivery]", e);
      res.status(500).json({ message: "Failed to load file" });
    }
  });

  app.post(
    "/api/upload",
    uploadLimiter,
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Файл не выбран" });
        }
        const url = await persistUploadedFile(req.file);
        assertPersistentMediaUrl(url);
        res.json({ url });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось сохранить файл";
        console.error("[upload]", message);
        res.status(500).json({ message });
      }
    },
  );

  app.post(
    "/api/users/avatar",
    uploadLimiter,
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Файл не выбран" });
        }
        const mime = req.file.mimetype || "";
        if (!mime.startsWith("image/")) {
          return res
            .status(400)
            .json({ message: "Аватар должен быть изображением (JPG, PNG, WebP, GIF)" });
        }
        const userId = getAuthUserId(req)!;
        const url = await persistUserAvatar(userId, req.file);
        const existing = await storage.getUser(userId);
        if (existing) {
          await storage.upsertUser({ ...existing, profileImageUrl: url });
        }
        res.json({ url });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось загрузить аватар";
        console.error("[avatar]", message);
        res.status(500).json({ message });
      }
    },
  );

  mountRoomAvatarRoute(app, upload);
}

async function isRoomAdminForUpload(roomId: string, userId: string): Promise<boolean> {
  const member = await storage.getChatRoomMember(roomId, userId);
  return member?.role === "admin" || member?.role === "owner";
}

function mountRoomAvatarRoute(
  app: Express,
  upload: ReturnType<typeof createUploadMiddleware>,
): void {
  app.post(
    "/api/chat/rooms/:id/avatar",
    uploadLimiter,
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req: Request, res: Response) => {
      try {
        const userId = getAuthUserId(req)!;
        const roomId = req.params.id;
        if (!(await isRoomAdminForUpload(roomId, userId))) {
          return res.status(403).json({ message: "Admin only" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "Файл не выбран" });
        }
        const mime = req.file.mimetype || "";
        if (!mime.startsWith("image/")) {
          return res
            .status(400)
            .json({ message: "Аватар должен быть изображением (JPG, PNG, WebP, GIF)" });
        }
        const url = await persistUploadedFile(req.file);
        assertPersistentMediaUrl(url);
        if (url.startsWith("data:")) {
          return res.status(500).json({ message: VERCEL_BLOB_REQUIRED_MSG });
        }
        const room = await storage.updateChatRoom(roomId, { avatarUrl: url });
        res.json({ url, room });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось загрузить аватар";
        console.error("[room-avatar]", message);
        res.status(500).json({ message });
      }
    },
  );
}

export function setupUploadRoutes(app: Express): void {
  mountUploadRoutes(app);
}
