import fs from "fs";
import path from "path";
import express, { type Express, type Request, type Response } from "express";
import multer from "multer";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";

/** Vercel serverless FS is read-only except /tmp */
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
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err) {
    console.error("[upload] failed to create uploads dir, using /tmp:", err);
    uploadsDir = path.join("/tmp", "ait-uploads-fallback");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }
  return uploadsDir;
}

function createUploadMiddleware() {
  const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, getUploadsDir()),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });

  return multer({
    storage: diskStorage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok =
        file.mimetype.startsWith("image/") ||
        file.mimetype === "video/mp4" ||
        file.mimetype === "video/webm" ||
        file.mimetype === "video/quicktime";
      if (ok) cb(null, true);
      else cb(new Error("Only images and videos (mp4, webm) allowed"));
    },
  });
}

export function setupUploadRoutes(app: Express): void {
  const dir = getUploadsDir();
  const upload = createUploadMiddleware();

  app.use("/uploads", express.static(dir));

  app.post("/api/upload", isAuthenticated, upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/users/avatar", isAuthenticated, upload.single("file"), async (req: any, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const userId = req.user.claims.sub;
    const url = `/uploads/${req.file.filename}`;
    const existing = await storage.getUser(userId);
    if (existing) {
      await storage.upsertUser({ ...existing, profileImageUrl: url });
    }
    res.json({ url });
  });
}
