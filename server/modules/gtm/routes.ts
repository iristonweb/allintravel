import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { ensurePlatformSchema } from "../../platform-schema";
import { CREATOR_PERKS, NOMAD_HUBS } from "./data";
import { z } from "zod";

export function registerGtmRoutes(app: Express): void {
  app.get("/api/gtm/nomad-hubs", (_req, res) => {
    res.json({ hubs: NOMAD_HUBS });
  });

  app.get("/api/gtm/nomad-hubs/:slug", (req, res) => {
    const hub = NOMAD_HUBS.find((h) => h.slug === req.params.slug);
    if (!hub) return res.status(404).json({ message: "Hub not found" });
    res.json(hub);
  });

  app.get("/api/gtm/creators", (_req, res) => {
    res.json({
      perks: CREATOR_PERKS,
      applyUrl: "/creators",
      revenueShare: "85% to creator on route sales",
    });
  });

  app.post("/api/gtm/creator-applications", async (req: Request, res: Response) => {
    try {
      await ensurePlatformSchema();
      const schema = z.object({
        email: z.string().email(),
        niche: z.string().max(120).optional(),
        message: z.string().max(2000).optional(),
      });
      const body = schema.parse(req.body);
      const userId = (req as Request & { user?: { claims: { sub: string } } }).user?.claims?.sub;

      const db = getDb();
      if (db) {
        await db.execute(sql`
          INSERT INTO creator_applications (user_id, email, niche, message)
          VALUES (${userId ?? null}, ${body.email}, ${body.niche ?? null}, ${body.message ?? null})
        `);
      }
      res.status(201).json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid input" });
      }
      console.error("creator-applications:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  app.post("/api/gtm/launch-waitlist", async (req: Request, res: Response) => {
    try {
      await ensurePlatformSchema();
      const schema = z.object({
        email: z.string().email(),
        locale: z.string().max(5).optional(),
      });
      const body = schema.parse(req.body);
      const db = getDb();
      if (db) {
        await db.execute(sql`
          INSERT INTO launch_waitlist (email, locale)
          VALUES (${body.email}, ${body.locale ?? "en"})
          ON CONFLICT (email) DO NOTHING
        `);
      }
      res.status(201).json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid email" });
      }
      console.error("launch-waitlist:", error);
      res.status(500).json({ message: "Failed to join waitlist" });
    }
  });

  app.get("/api/gtm/product-hunt", (_req, res) => {
    res.json({
      tagline: "The operating system for global life",
      launchDate: "2026-Q3",
      features: [
        "Travel Passport with share cards",
        "Map-native AI travel agent",
        "Trust reputation graph",
        "Route marketplace for creators",
      ],
      cta: "/launch",
    });
  });
}
