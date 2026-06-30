import type { Express } from "express";
import type { IStorage } from "../storage";
import { ensurePlatformSchema } from "../platform-schema";
import { registerPassportRoutes } from "./passport/routes";
import { registerTrustRoutes } from "./trust/routes";
import { registerMarketplaceRoutes } from "./marketplace/routes";
import { registerAiRoutes } from "./ai/routes";
import { registerGtmRoutes } from "./gtm/routes";
import { registerGeoRoutes } from "./geo/routes";
import { registerPostsRoutes } from "./posts/routes";

/** Registers platform expansion modules (passport, trust, marketplace, AI, GTM, geo, posts). */
export async function registerPlatformModules(app: Express, storage: IStorage): Promise<void> {
  await ensurePlatformSchema();
  registerGeoRoutes(app, storage);
  registerPassportRoutes(app);
  registerTrustRoutes(app);
  registerMarketplaceRoutes(app);
  registerAiRoutes(app);
  registerGtmRoutes(app);
  registerPostsRoutes(app, storage);
}
