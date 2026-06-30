import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../../auth";
import { storage } from "../../storage";
import { userCanManageTrip } from "../../security";
import {
  createStripeConnectLink,
  forkTripWithAttribution,
  getStripeConnectStatus,
  purchaseTripRoute,
  setTripMarketplace,
} from "./service";
import { grantSpend } from "../../ait/hooks";

export function registerMarketplaceRoutes(app: Express): void {
  app.post("/api/trips/:id/fork", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const trip = await forkTripWithAttribution(storage, req.params.id, userId);
      const aitGrant = await grantSpend(userId, "trip_created", {
        entityType: "trip",
        entityId: trip.id,
      });
      res.status(201).json({ ...trip, aitGrant: aitGrant ?? null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fork trip";
      const status = msg === "Forbidden" ? 403 : msg === "Trip not found" ? 404 : 500;
      res.status(status).json({ message: msg });
    }
  });

  app.patch("/api/trips/:id/marketplace", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const priceCents = Number(req.body?.priceCents ?? 0);
      const isForSale = Boolean(req.body?.isForSale);
      const trip = await setTripMarketplace(storage, req.params.id, userId, priceCents, isForSale);
      res.json(trip);
    } catch (error) {
      console.error("marketplace/update:", error);
      res.status(500).json({ message: "Failed to update marketplace settings" });
    }
  });

  app.post("/api/trips/:id/purchase", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const result = await purchaseTripRoute(storage, req.params.id, userId);
      res.json(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Purchase failed";
      res.status(400).json({ message: msg });
    }
  });

  app.get(
    "/api/marketplace/stripe/status",
    isAuthenticated,
    async (req: Request, res: Response) => {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const status = await getStripeConnectStatus(userId);
      res.json(status);
    },
  );

  app.post(
    "/api/marketplace/stripe/connect",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
        const user = await storage.getUser(userId);
        if (!user?.email) return res.status(400).json({ message: "Email required" });
        const appUrl = process.env.APP_URL?.trim() || `${req.protocol}://${req.get("host")}`;
        const link = await createStripeConnectLink(
          userId,
          user.email,
          `${appUrl}/creators?stripe=return`,
          `${appUrl}/creators?stripe=refresh`,
        );
        res.json(link);
      } catch (error) {
        console.error("stripe/connect:", error);
        res.status(500).json({ message: "Stripe connect failed" });
      }
    },
  );
}
