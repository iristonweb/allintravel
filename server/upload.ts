import express, { type Express, type Request, type Response, type NextFunction } from "express";
import multer, { MulterError } from "multer";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";
import { getUploadsStaticDir, persistUploadedFile } from "./media-storage";

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
]);

function isAllowedMime(mime: string, originalName: string): boolean {
  if (ALLOWED_MIME.has(mime)) return true;
  if (mime.startsWith("image/")) return true;
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".gif")) return true;
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) return true;
  return false;
}

function createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (isAllowedMime(file.mimetype, file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error("Допустимы фото (JPG, PNG, WebP, GIF) и видео MP4/WebM"));
      }
    },
  });
}

function handleMulter(
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
          ? "Файл слишком большой (макс. 50 МБ)"
          : err.message;
      return res.status(400).json({ message: msg });
    }
    const message = err instanceof Error ? err.message : "Ошибка загрузки";
    return res.status(400).json({ message });
  });
}

export function setupUploadRoutes(app: Express): void {
  const upload = createUploadMiddleware();
  const dir = getUploadsStaticDir();

  app.use("/uploads", express.static(dir));

  app.post(
    "/api/upload",
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Файл не выбран" });
        }
        const url = await persistUploadedFile(req.file);
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
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req: any, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Файл не выбран" });
        }
        const mime = req.file.mimetype || "";
        if (!mime.startsWith("image/")) {
          return res.status(400).json({ message: "Аватар должен быть изображением (JPG, PNG, WebP, GIF)" });
        }
        const userId = req.user.claims.sub;
        const url = await persistUploadedFile(req.file);
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
}
