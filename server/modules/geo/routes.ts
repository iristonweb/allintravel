import type { Express, Request, Response } from "express";
import type { IStorage } from "../../storage";
import { allowGeoRequest } from "../../geo/nominatim";
import { searchLimiter } from "../../rate-limit";

/** Geo & search routes — extracted from monolithic routes.ts */
export function registerGeoRoutes(app: Express, storage: IStorage): void {
  app.get("/api/geo/autocomplete", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 8;
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(15, Math.floor(limitRaw)))
        : 10;
      const scopeRaw = typeof req.query.scope === "string" ? req.query.scope : "all";
      const scope =
        scopeRaw === "city" || scopeRaw === "country" || scopeRaw === "all" || scopeRaw === "full"
          ? scopeRaw
          : "all";

      if (q.length < 2) return res.json([]);

      const ip =
        (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      if (!allowGeoRequest(`geo:${ip}`)) {
        return res.status(429).json({ message: "Too many requests" });
      }

      const acceptLanguage =
        (req.headers["accept-language"] as string | undefined) ??
        (typeof req.query.lang === "string" ? req.query.lang : undefined);

      const { resolveGeoAutocomplete } = await import("../../geo/resolve-autocomplete");
      const items = await resolveGeoAutocomplete({ q, limit, scope, acceptLanguage });
      return res.json(items);
    } catch (error) {
      console.error("Error fetching geo autocomplete:", error);
      res.status(500).json({ message: "Failed to fetch geo autocomplete" });
    }
  });

  app.get("/api/search/destinations", searchLimiter, async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 10;
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(15, Math.floor(limitRaw)))
        : 10;
      const type = typeof req.query.type === "string" ? req.query.type : undefined;

      if (q.length < 2) return res.json({ locations: [], places: [] });

      const ip =
        (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      if (!allowGeoRequest(`search:${ip}`)) {
        return res.status(429).json({ message: "Too many requests" });
      }

      const acceptLanguage =
        (req.headers["accept-language"] as string | undefined) ??
        (typeof req.query.lang === "string" ? req.query.lang : undefined);

      const { resolveGeoAutocomplete } = await import("../../geo/resolve-autocomplete");
      const geoLimit = Math.min(8, limit);

      const [locations, places] = await Promise.all([
        resolveGeoAutocomplete({ q, limit: geoLimit, scope: "all", acceptLanguage }),
        storage.getPlaces({
          search: q,
          type: type && type !== "all" ? type : undefined,
          limit: Math.min(10, limit),
        }),
      ]);

      res.json({ locations, places });
    } catch (error) {
      console.error("Error searching destinations:", error);
      res.status(500).json({ message: "Failed to search destinations" });
    }
  });
}
