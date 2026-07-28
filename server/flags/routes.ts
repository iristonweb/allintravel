import type { Express, Request, Response } from "express";
import { isAuthenticated, isAdmin } from "../auth";
import { listFlags, setFlag } from "./index";
import { FLAG_KEYS } from "./keys";

export function registerFlagRoutes(app: Express): void {
  app.get("/api/admin/flags", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    const flags = await listFlags();
    res.json({ flags });
  });

  app.put(
    "/api/admin/flags/:key",
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      const key = String(req.params.key ?? "");
      if (!FLAG_KEYS.includes(key as (typeof FLAG_KEYS)[number])) {
        return res.status(400).json({ message: "Unknown flag key" });
      }
      const enabled = Boolean((req.body as { enabled?: boolean })?.enabled);
      await setFlag(key, enabled);
      res.json({ key, enabled });
    },
  );
}
