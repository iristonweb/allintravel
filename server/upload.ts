import fs from "fs";
import path from "path";
import express, { type Express, type Request, type Response } from "express";
import multer from "multer";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";

const uploadsDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

export function setupUploadRoutes(app: Express): void {
  app.use("/uploads", express.static(uploadsDir));

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
