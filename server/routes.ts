import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession, type SessionUser } from "./auth";
import { isGoogleAuthEnabled } from "./google-auth";
import passport from "passport";
import { allowGeoRequest } from "./geo/nominatim";
import { 
  insertPlaceSchema, 
  insertReviewSchema, 
  insertTripSchema, 
  insertEventSchema,
  insertChatMessageSchema,
  insertUserProfileSchema,
  insertFriendshipSchema,
  insertUserFollowSchema,
  insertPrivateMessageSchema,
  updateChatMessageSchema,
  updatePrivateMessageSchema,
  insertTravelPostSchema,
  insertPostLikeSchema,
  insertPostCommentSchema,
  updateTravelPostSchema,
  updateUserProfileSchema,
} from "@shared/schema";
import { z } from "zod";
import { validateUsername } from "@shared/username";
import { updatePrivacySettingsSchema } from "@shared/privacy";
import { isTravelDirectionId } from "@shared/travel-directions";
import { toPublicUser, toSelfUser } from "./user-utils";
import { userCanManageTrip } from "./security";
import { resolveChatRoomAccess, ensureMemberForPost } from "./chat-access";
import {
  canViewProfile,
  canSendDm,
  canSendFriendRequest,
  canSeeOnlineStatus,
} from "./privacy-helpers";
import {
  notifyFriendRequest,
  notifyFriendAccepted,
  notifyNewMessage,
  notifyTripJoin,
  notifyEventRegistration,
  notifyGroupJoin,
} from "./notification-service";
import { registerUserSocket, unregisterUserSocket } from "./realtime-hub";

const updateUserMeSchema = z.object({
  displayName: z.string().max(64).nullable().optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  username: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Geo autocomplete
  app.get("/api/geo/autocomplete", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 8;
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(15, Math.floor(limitRaw))) : 10;
      const scopeRaw = typeof req.query.scope === "string" ? req.query.scope : "all";
      const scope =
        scopeRaw === "city" || scopeRaw === "country" || scopeRaw === "all" || scopeRaw === "full"
          ? scopeRaw
          : "all";

      if (q.length < 2) {
        return res.json([]);
      }

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

      const { resolveGeoAutocomplete } = await import("./geo/resolve-autocomplete");
      const items = await resolveGeoAutocomplete({ q, limit, scope, acceptLanguage });
      return res.json(items);
    } catch (error) {
      console.error("Error fetching geo autocomplete:", error);
      res.status(500).json({ message: "Failed to fetch geo autocomplete" });
    }
  });

  app.get("/api/search/destinations", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 10;
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(15, Math.floor(limitRaw))) : 10;
      const type = typeof req.query.type === "string" ? req.query.type : undefined;

      if (q.length < 2) {
        return res.json({ locations: [], places: [] });
      }

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

      const { resolveGeoAutocomplete } = await import("./geo/resolve-autocomplete");
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

  app.get("/api/map/pois", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const type = typeof req.query.type === "string" ? req.query.type : undefined;
      const latRaw = req.query.lat != null ? Number(req.query.lat) : NaN;
      const lonRaw = req.query.lon != null ? Number(req.query.lon) : NaN;
      const lat = Number.isFinite(latRaw) ? latRaw : undefined;
      const lon = Number.isFinite(lonRaw) ? lonRaw : undefined;

      if (q.length < 2) {
        return res.json({ places: [] });
      }

      const ip =
        (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const { allowGeoRequest: allowPoi } = await import("./geo/nominatim-poi");
      if (!allowPoi(`poi:${ip}`)) {
        return res.status(429).json({ message: "Too many requests" });
      }

      const acceptLanguage =
        (req.headers["accept-language"] as string | undefined) ??
        (typeof req.query.lang === "string" ? req.query.lang : undefined);

      const segments = q
        .split(/[,;]|(?:\s+—\s+)|(?:\s+–\s+)|(?:\s+-\s+)/)
        .map((s) => s.trim())
        .filter(Boolean);
      const keywords =
        segments.length >= 2 ? segments[segments.length - 1]! : q;
      const locationHint =
        segments.length >= 2 ? segments.slice(0, -1).join(", ") : q;

      const catalogTerms = [keywords, locationHint, q].filter(
        (t, i, arr) => t.length >= 2 && arr.indexOf(t) === i,
      );

      const catalogBatches = await Promise.all(
        catalogTerms.map((term) =>
          storage.getPlaces({
            search: term,
            type: type && type !== "all" ? type : undefined,
            limit: 20,
          }),
        ),
      );

      const catalogMap = new Map<string, (typeof catalogBatches)[0][0]>();
      for (const batch of catalogBatches) {
        for (const p of batch) {
          catalogMap.set(p.id, p);
        }
      }

      const { nominatimPoiSearch } = await import("./geo/nominatim-poi");
      const osmPlaces = await nominatimPoiSearch({
        q: keywords.length >= 2 ? keywords : q,
        limit: 20,
        lat,
        lon,
        filterType: type,
        acceptLanguage,
      });

      const merged = [
        ...Array.from(catalogMap.values()),
        ...osmPlaces.filter((o) => !catalogMap.has(o.id)),
      ].slice(0, 40);

      res.json({ places: merged });
    } catch (error) {
      console.error("Error searching map POIs:", error);
      res.status(500).json({ message: "Failed to search places on map" });
    }
  });

  app.get("/api/geo/status", async (_req, res) => {
    try {
      let countries = 0;
      let cities = 0;
      const { getDb } = await import("./db");
      const db = getDb();
      if (db) {
        const { countries: countriesTable, cities: citiesTable } = await import("@shared/schema");
        const { count } = await import("drizzle-orm");
        const [c1] = await db.select({ value: count() }).from(countriesTable);
        const [c2] = await db.select({ value: count() }).from(citiesTable);
        countries = Number(c1?.value ?? 0);
        cities = Number(c2?.value ?? 0);
      }
      const {
        isAnyYandexGeoConfigured,
        isYandexGeocoderConfigured,
        isYandexGeosuggestConfigured,
        isYandexRouterConfigured,
      } = await import("./geo/yandex-config");
      res.json({
        database: Boolean(process.env.DATABASE_URL),
        geoImported: countries > 0 && cities > 0,
        countries,
        cities,
        yandexGeosuggest: isYandexGeosuggestConfigured(),
        yandexGeocoder: isYandexGeocoderConfigured(),
        yandexRouter: isYandexRouterConfigured(),
        yandex: isAnyYandexGeoConfigured(),
        nominatimFallback: true,
      });
    } catch (error) {
      console.error("geo status error:", error);
      res.status(500).json({ message: "Failed to read geo status" });
    }
  });

  app.get("/api/auth/config", (_req, res) => {
    res.json({
      googleOAuth: isGoogleAuthEnabled(),
      /** First login with email + password creates the account (no separate signup page). */
      emailSignup: true,
    });
  });

  // Auth routes
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const sessionUser = req.user as SessionUser | undefined;
      const userId = sessionUser?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(toSelfUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.put("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const body = updateUserMeSchema.parse(req.body);
      const patch: {
        displayName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        username?: string;
      } = {};

      if (body.displayName !== undefined) patch.displayName = body.displayName;
      if (body.firstName !== undefined) patch.firstName = body.firstName;
      if (body.lastName !== undefined) patch.lastName = body.lastName;

      if (body.username !== undefined) {
        const parsed = validateUsername(body.username);
        if (!parsed.ok) {
          return res.status(400).json({ message: parsed.message });
        }
        const taken = await storage.getUserByUsername(parsed.value);
        if (taken && taken.id !== userId) {
          return res.status(409).json({ message: "Этот ник уже занят" });
        }
        patch.username = parsed.value;
      }

      const updated = await storage.updateUserMe(userId, patch);
      res.json(toSelfUser(updated));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users/by-username/:username", async (req, res) => {
    try {
      const parsed = validateUsername(req.params.username);
      if (!parsed.ok) return res.status(400).json({ message: parsed.message });
      const user = await storage.getUserByUsername(parsed.value);
      if (!user) return res.status(404).json({ message: "User not found" });
      const viewerId = req.isAuthenticated() ? (req.user as SessionUser).claims.sub : undefined;
      const settings = await storage.getPrivacySettings(user.id);
      const isFriend = viewerId ? await storage.areFriends(viewerId, user.id) : false;
      if (!canViewProfile(settings, viewerId, user.id, isFriend)) {
        return res.status(403).json({ message: "Profile is private" });
      }
      if (viewerId === user.id) return res.json(toSelfUser(user));
      const presence = await storage.getPresence(user.id);
      const showOnline = canSeeOnlineStatus(settings, viewerId, user.id, isFriend);
      res.json({
        ...toPublicUser(user),
        isOnline: showOnline ? presence?.isOnline ?? false : undefined,
        lastSeenAt: showOnline && settings.showLastSeen ? presence?.lastSeenAt : undefined,
        isFriend,
      });
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const sessionUser = req.isAuthenticated() ? (req.user as SessionUser) : undefined;
      const viewerId = sessionUser?.claims?.sub;
      if (viewerId === user.id) {
        return res.json(toSelfUser(user));
      }
      const settings = await storage.getPrivacySettings(user.id);
      const isFriend = viewerId ? await storage.areFriends(viewerId, user.id) : false;
      if (!canViewProfile(settings, viewerId, user.id, isFriend)) {
        return res.status(403).json({ message: "Profile is private" });
      }
      res.json(toPublicUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/settings/privacy", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getPrivacySettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      res.status(500).json({ message: "Failed to fetch privacy settings" });
    }
  });

  app.put("/api/settings/privacy", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = updatePrivacySettingsSchema.parse(req.body);
      const settings = await storage.updatePrivacySettings(userId, body);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid privacy settings", errors: error.errors });
      }
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });

  app.post("/api/presence/heartbeat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isOnline = req.body?.isOnline !== false;
      const presence = await storage.touchPresence(userId, isOnline);
      res.json(presence);
    } catch (error) {
      console.error("Error updating presence:", error);
      res.status(500).json({ message: "Failed to update presence" });
    }
  });

  // Place routes
  app.get('/api/places', async (req, res) => {
    try {
      const { type, search, minRating, priceRange, limit = 20, offset = 0 } = req.query;
      const places = await storage.getPlaces({
        type: type as string,
        search: search as string,
        minRating: minRating ? Number(minRating) : undefined,
        priceRange: priceRange as string,
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ message: "Failed to fetch places" });
    }
  });

  app.get('/api/places/:id', async (req, res) => {
    try {
      const place = await storage.getPlace(req.params.id);
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }
      res.json(place);
    } catch (error) {
      console.error("Error fetching place:", error);
      res.status(500).json({ message: "Failed to fetch place" });
    }
  });

  app.post('/api/places', isAuthenticated, async (req, res) => {
    try {
      const placeData = insertPlaceSchema.parse(req.body);
      const place = await storage.createPlace(placeData);
      res.status(201).json(place);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid place data", errors: error.errors });
      }
      console.error("Error creating place:", error);
      res.status(500).json({ message: "Failed to create place" });
    }
  });

  // Review routes
  app.get('/api/places/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviewsByPlace(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/places/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
        placeId: req.params.id,
      });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // User reviews route
  app.get('/api/reviews/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await storage.getReviewsByUser(userId);
      const enriched = await Promise.all(reviews.map(async (review) => {
        const place = await storage.getPlace(review.placeId);
        return { ...review, place: place || null };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  // Trip routes
  app.get('/api/trips', async (req, res) => {
    try {
      const { userId, destination, startDate, endDate, limit = 20, offset = 0 } = req.query;
      const trips = await storage.getTrips({
        userId: userId as string,
        destination: destination as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get('/api/trips/my-participations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripIds = await storage.getTripParticipationsByUser(userId);
      res.json({ tripIds });
    } catch (error) {
      console.error("Error fetching my participations:", error);
      res.status(500).json({ message: "Failed to fetch participations" });
    }
  });

  app.get('/api/trips/:id/waypoints', async (req, res) => {
    try {
      const waypoints = await storage.getTripWaypoints(req.params.id);
      res.json(waypoints);
    } catch (error) {
      console.error("Error fetching trip waypoints:", error);
      res.status(500).json({ message: "Failed to fetch waypoints" });
    }
  });

  app.get("/api/trips/:id/yandex-route", async (req, res) => {
    try {
      const { isYandexRouterConfigured } = await import("./geo/yandex-config");
      if (!isYandexRouterConfigured()) {
        return res.status(503).json({ message: "Yandex Router API key not configured" });
      }
      const waypoints = await storage.getTripWaypoints(req.params.id);
      const points = waypoints
        .filter((w) => w.place?.latitude != null && w.place?.longitude != null)
        .map((w) => ({
          lat: Number(w.place!.latitude),
          lon: Number(w.place!.longitude),
        }));
      if (points.length < 2) {
        return res.json({ configured: true, route: null, message: "Need at least 2 stops" });
      }
      const mode =
        req.query.mode === "walking" || req.query.mode === "driving"
          ? req.query.mode
          : "driving";
      const { yandexBuildRoute } = await import("./geo/yandex-router");
      const route = await yandexBuildRoute(points, mode);
      if (!route) {
        return res.json({ configured: true, route: null });
      }
      res.json({
        configured: true,
        route: {
          distanceKm: Math.round((route.distanceM / 1000) * 10) / 10,
          durationMin: Math.round(route.durationS / 60),
          geometry: route.geometry,
        },
      });
    } catch (error) {
      console.error("Error building Yandex route:", error);
      res.status(500).json({ message: "Failed to build route" });
    }
  });

  app.get("/api/geo/geocode", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (q.length < 2) return res.json(null);
      const { yandexForwardGeocode } = await import("./geo/yandex");
      const result = await yandexForwardGeocode(q);
      res.json(result);
    } catch (error) {
      console.error("Error geocoding:", error);
      res.status(500).json({ message: "Failed to geocode" });
    }
  });

  app.post('/api/trips/:id/waypoints', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { placeId, orderIndex, dayNumber } = req.body;
      const waypoint = await storage.addTripWaypoint(
        req.params.id,
        placeId,
        orderIndex != null ? Number(orderIndex) : undefined,
        dayNumber != null ? Number(dayNumber) : undefined
      );
      res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error adding waypoint:", error);
      res.status(500).json({ message: "Failed to add waypoint" });
    }
  });

  app.post('/api/trips/:id/waypoints/from-location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const label = String(req.body?.label ?? "").trim();
      const lat = Number(req.body?.lat);
      const lon = Number(req.body?.lon);
      if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ message: "Укажите адрес и координаты" });
      }

      const name = label.split(",")[0]?.trim() || label;
      const candidates = await storage.getPlaces({ search: name, limit: 10 });
      let place = candidates.find((p) => {
        const plat = Number(p.latitude);
        const plon = Number(p.longitude);
        return (
          Number.isFinite(plat) &&
          Number.isFinite(plon) &&
          Math.abs(plat - lat) < 0.08 &&
          Math.abs(plon - lon) < 0.08
        );
      });

      if (!place) {
        place = await storage.createPlace({
          name,
          type: "attraction",
          latitude: String(lat),
          longitude: String(lon),
          address: label,
          description: "Точка маршрута",
        });
      }

      const waypoint = await storage.addTripWaypoint(
        req.params.id,
        place.id,
        req.body.orderIndex != null ? Number(req.body.orderIndex) : undefined,
        req.body.dayNumber != null ? Number(req.body.dayNumber) : undefined,
      );
      res.status(201).json({ waypoint, place });
    } catch (error) {
      console.error("Error adding waypoint from location:", error);
      res.status(500).json({ message: "Не удалось добавить остановку" });
    }
  });

  app.patch('/api/trips/:id/waypoints/:waypointId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const existingWp = await storage.getTripWaypoint(req.params.waypointId);
      if (!existingWp || existingWp.tripId !== req.params.id) {
        return res.status(404).json({ message: "Waypoint not found" });
      }
      const { orderIndex, dayNumber } = req.body;
      const waypoint = await storage.updateTripWaypoint(req.params.waypointId, {
        orderIndex: orderIndex != null ? Number(orderIndex) : undefined,
        dayNumber: dayNumber != null ? Number(dayNumber) : undefined,
      });
      if (!waypoint) {
        return res.status(404).json({ message: "Waypoint not found" });
      }
      res.json(waypoint);
    } catch (error) {
      console.error("Error updating waypoint:", error);
      res.status(500).json({ message: "Failed to update waypoint" });
    }
  });

  app.delete('/api/trips/:id/waypoints/:waypointId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const existingWp = await storage.getTripWaypoint(req.params.waypointId);
      if (!existingWp || existingWp.tripId !== req.params.id) {
        return res.status(404).json({ message: "Waypoint not found" });
      }
      await storage.removeTripWaypoint(req.params.waypointId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing waypoint:", error);
      res.status(500).json({ message: "Failed to remove waypoint" });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = insertTripSchema.parse({
        ...req.body,
        userId,
      });
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  app.post('/api/trips/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trip = await storage.getTrip(req.params.id);
      const participant = await storage.joinTrip(req.params.id, userId);
      if (trip) {
        const joiner = await storage.getUser(userId);
        if (joiner) void notifyTripJoin(trip.userId, joiner, trip.id, trip.title);
      }
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining trip:", error);
      res.status(500).json({ message: "Failed to join trip" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const { type, upcoming, limit = 20, offset = 0 } = req.query;
      const events = await storage.getEvents({
        type: type as string,
        upcoming: upcoming === 'true',
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({
        ...req.body,
        organizerId: userId,
      });
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get('/api/events/registrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventIds = await storage.getRegisteredEventIds(userId);
      res.json({ eventIds });
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events/:id/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      const registration = await storage.registerForEvent(req.params.id, userId);
      const registrant = await storage.getUser(userId);
      if (registrant) {
        void notifyEventRegistration(event.organizerId, registrant, event.id, event.title);
      }
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.delete('/api/events/:id/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unregisterFromEvent(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unregistering from event:", error);
      res.status(500).json({ message: "Failed to unregister" });
    }
  });

  app.get('/api/trips/:id/participants', isAuthenticated, async (req: any, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      const participants = await storage.getTripParticipants(req.params.id);
      const enriched = await Promise.all(
        participants.map(async (p) => {
          const raw = p.userId ? await storage.getUser(p.userId) : null;
          return {
            ...p,
            user: raw ? toPublicUser(raw) : null,
          };
        }),
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  app.get('/api/follow/:userId/check', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const isFollowing = await storage.isFollowing(followerId, req.params.userId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [receivedRequests, conversations, dbItems, unreadNotifs] = await Promise.all([
        storage.getFriendRequests(userId, "received"),
        storage.getConversations(userId),
        storage.getNotifications(userId, 40),
        storage.getUnreadNotificationCount(userId),
      ]);
      const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      res.json({
        friendRequests: receivedRequests.length,
        unreadMessages,
        totalUnread: unreadNotifs + receivedRequests.length + unreadMessages,
        items: dbItems.map((n) => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          actorId: n.actorId,
          entityId: n.entityId,
          isRead: n.isRead,
          createdAt: n.createdAt?.toISOString() ?? null,
        })),
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markNotificationRead(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.put("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking all read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  const createRoomSchema = z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    avatarUrl: z.string().max(500).optional(),
    visibility: z.enum(["public", "private"]),
    slug: z.string().max(100).optional(),
  });

  const isRoomAdmin = async (roomId: string, userId: string) => {
    const m = await storage.getChatRoomMember(roomId, userId);
    return m?.status === "active" && (m.role === "admin" || m.role === "owner");
  };

  app.get("/api/chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.ensureLegacyChatRooms();
      const rooms = await storage.listChatRoomsForUser(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error listing chat rooms:", error);
      res.status(500).json({ message: "Failed to list rooms" });
    }
  });

  app.post("/api/chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = createRoomSchema.parse(req.body);
      const room = await storage.createChatRoom({
        title: body.title,
        description: body.description,
        avatarUrl: body.avatarUrl,
        visibility: body.visibility,
        ...(body.slug ? { slug: body.slug } : {}),
        createdBy: userId,
      });
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room data", errors: error.errors });
      }
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get("/api/chat/rooms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.getChatRoom(req.params.id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const access = await resolveChatRoomAccess(storage, room.slug, userId);
      if (!access.allowed) return res.status(403).json({ message: access.reason });
      const members = await storage.getChatRoomMembers(room.id);
      const pinnedIds = await storage.getPinnedMessageIds(room.id);
      res.json({ ...room, memberCount: members.length, members, pinnedMessageIds: pinnedIds, myRole: (await storage.getChatRoomMember(room.id, userId))?.role ?? null });
    } catch (error) {
      console.error("Error fetching chat room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.patch("/api/chat/rooms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await isRoomAdmin(req.params.id, userId))) {
        return res.status(403).json({ message: "Admin only" });
      }
      const patch = createRoomSchema.partial().parse(req.body);
      const room = await storage.updateChatRoom(req.params.id, patch);
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.post("/api/chat/rooms/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.getChatRoom(req.params.id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      if (room.visibility === "private") {
        return res.status(403).json({ message: "Use invite link for private rooms" });
      }
      const member = await storage.joinChatRoom(room.id, userId);
      res.json(member);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.post("/api/chat/rooms/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leaveChatRoom(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  app.post("/api/chat/rooms/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await isRoomAdmin(req.params.id, userId))) {
        return res.status(403).json({ message: "Admin only" });
      }
      const invite = await storage.createChatRoomInvite(req.params.id, userId);
      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  app.post("/api/chat/join/:token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.joinChatRoomByToken(req.params.token, userId);
      const joiner = await storage.getUser(userId);
      if (joiner) {
        const members = await storage.getChatRoomMembers(room.id);
        const adminIds = members
          .filter((m) => m.role === "owner" || m.role === "admin")
          .map((m) => m.userId);
        void notifyGroupJoin(adminIds, joiner, room.title, room.slug);
      }
      res.json(room);
    } catch (error) {
      console.error("Error joining by token:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to join" });
    }
  });

  app.get("/api/chat/rooms/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.getChatRoom(req.params.id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const access = await resolveChatRoomAccess(storage, room.slug, userId);
      if (!access.allowed) return res.status(403).json({ message: access.reason });
      const members = await storage.getChatRoomMembers(room.id);
      res.json(members.map((m) => ({ ...m, user: toPublicUser(m.user) })));
    } catch (error) {
      console.error("Error listing members:", error);
      res.status(500).json({ message: "Failed to list members" });
    }
  });

  const canManageChatMessage = async (roomId: string, messageId: string, userId: string) => {
    const msg = await storage.getChatMessage(messageId);
    if (!msg) return { ok: false as const, status: 404, message: "Message not found" };
    if (msg.userId === userId) return { ok: true as const, msg };
    if (await isRoomAdmin(roomId, userId)) return { ok: true as const, msg };
    return { ok: false as const, status: 403, message: "Forbidden" };
  };

  app.post("/api/chat/rooms/:roomId/messages/:messageId/pin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const access = await canManageChatMessage(req.params.roomId, req.params.messageId, userId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });
      await storage.pinChatMessage(req.params.roomId, req.params.messageId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error pinning message:", error);
      res.status(500).json({ message: "Failed to pin" });
    }
  });

  app.delete("/api/chat/rooms/:roomId/messages/:messageId/pin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const access = await canManageChatMessage(req.params.roomId, req.params.messageId, userId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });
      await storage.unpinChatMessage(req.params.roomId, req.params.messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unpinning message:", error);
      res.status(500).json({ message: "Failed to unpin" });
    }
  });

  app.delete("/api/chat/rooms/:roomId/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const access = await canManageChatMessage(req.params.roomId, req.params.messageId, userId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });
      await storage.deleteChatMessage(req.params.messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.patch("/api/chat/rooms/:roomId/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getChatMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      if (msg.userId !== userId) return res.status(403).json({ message: "Only author can edit" });
      const { content } = updateChatMessageSchema.parse(req.body);
      const updated = await storage.updateChatMessage(req.params.messageId, content);
      const sender = await storage.getUser(userId);
      const likeMeta = await storage.getChatMessageLikeMeta([req.params.messageId], userId);
      const meta = likeMeta[req.params.messageId] ?? { likeCount: 0, likedByMe: false };
      res.json({
        ...updated,
        ...meta,
        sender: sender ? toPublicUser(sender) : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content", errors: error.errors });
      }
      console.error("Error editing message:", error);
      res.status(500).json({ message: "Failed to edit" });
    }
  });

  app.post("/api/chat/rooms/:roomId/messages/:messageId/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getChatMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const meta = await storage.toggleChatMessageLike(req.params.messageId, userId);
      res.json(meta);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Chat routes (HTTP fallback for Vercel — WebSocket is not available on serverless)
  const enrichChatMessages = async (
    messages: Awaited<ReturnType<typeof storage.getChatMessages>>,
    viewerId: string,
  ) => {
    const ids = messages.map((m) => m.id).filter(Boolean) as string[];
    const likeMeta = await storage.getChatMessageLikeMeta(ids, viewerId);
    return Promise.all(
      messages.map(async (msg) => {
        const sender = msg.userId ? await storage.getUser(msg.userId) : null;
        const meta = likeMeta[msg.id] ?? { likeCount: 0, likedByMe: false };
        return {
          ...msg,
          ...meta,
          sender: sender ? toPublicUser(sender) : null,
        };
      }),
    );
  };

  app.get("/api/chat/:room", isAuthenticated, async (req: any, res) => {
    try {
      const { room } = req.params;
      const userId = req.user.claims.sub;
      await storage.ensureLegacyChatRooms();
      const access = await resolveChatRoomAccess(storage, room, userId);
      if (!access.allowed) {
        return res.status(403).json({ message: access.reason });
      }
      const { limit = 50 } = req.query;
      const messages = await storage.getChatMessages(room, Number(limit));
      const withSenders = await enrichChatMessages(messages, userId);
      const pinnedIds = access.room ? await storage.getPinnedMessageIds(access.room.id) : [];
      res.json({ messages: withSenders, pinnedMessageIds: pinnedIds, room: access.room });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/:room", isAuthenticated, async (req: any, res) => {
    try {
      const { room } = req.params;
      const userId = req.user.claims.sub;
      await storage.ensureLegacyChatRooms();
      const access = await resolveChatRoomAccess(storage, room, userId);
      if (!access.allowed) {
        return res.status(403).json({ message: access.reason });
      }
      if (!access.canPost) {
        return res.status(403).json({ message: "Cannot post in this room" });
      }
      await ensureMemberForPost(storage, access.room, userId);
      const content = String(req.body?.content ?? "").trim();
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      const messageData = insertChatMessageSchema.parse({
        userId,
        content,
        chatRoom: room,
      });
      const savedMessage = await storage.createChatMessage(messageData);
      const sender = await storage.getUser(userId);
      res.status(201).json({
        ...savedMessage,
        sender: sender
          ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              profileImageUrl: sender.profileImageUrl,
            }
          : null,
      });
    } catch (error) {
      console.error("Error posting chat message:", error);
      res.status(500).json({ message: "Failed to post message" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      const enriched = await Promise.all(favorites.map(async (fav) => {
        const place = await storage.getPlace(fav.placeId);
        return { ...fav, place: place || null };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites/:placeId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { placeId } = req.params;
      const favorite = await storage.addFavorite(userId, placeId);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:placeId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { placeId } = req.params;
      await storage.removeFavorite(userId, placeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:placeId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { placeId } = req.params;
      const isFavorite = await storage.isFavorite(userId, placeId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Social features API routes

  // User profile routes
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const viewerId = req.isAuthenticated() ? (req.user as SessionUser).claims.sub : undefined;
      const settings = await storage.getPrivacySettings(userId);
      const isFriend = viewerId ? await storage.areFriends(viewerId, userId) : false;
      if (!canViewProfile(settings, viewerId, userId, isFriend)) {
        return res.status(403).json({ message: "Profile is private" });
      }
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.json({
          userId,
          bio: null,
          location: null,
          travelStyle: null,
          isPublic: !settings.isPrivateAccount,
          createdAt: null,
          updatedAt: null,
        });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertUserProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = updateUserProfileSchema.parse(req.body);
      const profile = await storage.updateUserProfile(userId, profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Friend routes
  app.post('/api/friends/request/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const addresseeId = req.params.userId;
      const targetSettings = await storage.getPrivacySettings(addresseeId);
      const isFriend = await storage.areFriends(requesterId, addresseeId);
      if (!canSendFriendRequest(targetSettings, requesterId, addresseeId, isFriend)) {
        return res.status(403).json({ message: "User does not accept friend requests" });
      }
      const direction =
        typeof req.body?.direction === "string" && isTravelDirectionId(req.body.direction)
          ? req.body.direction
          : undefined;
      const friendship = await storage.sendFriendRequest(requesterId, addresseeId, direction);
      const requester = await storage.getUser(requesterId);
      if (requester) {
        void notifyFriendRequest(storage, addresseeId, requester, friendship.id);
      }
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put('/api/friends/respond/:friendshipId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = z.enum(["accepted", "rejected"]).parse(req.body?.status);
      const existing = await storage.getFriendshipById(req.params.friendshipId);
      if (!existing) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      if (existing.addresseeId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (existing.status !== "pending") {
        return res.status(400).json({ message: "Request already handled" });
      }
      const direction =
        typeof req.body?.direction === "string" && isTravelDirectionId(req.body.direction)
          ? req.body.direction
          : undefined;
      const friendship = await storage.respondToFriendRequest(req.params.friendshipId, status, direction);
      if (status === "accepted") {
        const accepter = await storage.getUser(userId);
        if (accepter) {
          void notifyFriendAccepted(storage, friendship.requesterId, accepter, friendship.id);
        }
      }
      res.json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status" });
      }
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const direction =
        typeof req.query.direction === "string" && isTravelDirectionId(req.query.direction)
          ? req.query.direction
          : undefined;
      const friends = await storage.getFriends(userId, direction);
      res.json(friends.map(toPublicUser));
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friends/requests/:type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.params.type as 'sent' | 'received';
      const requests = await storage.getFriendRequests(userId, type);
      const enriched = await Promise.all(requests.map(async (friendship) => {
        const otherUserId = type === 'sent' ? friendship.addresseeId : friendship.requesterId;
        const user = await storage.getUser(otherUserId);
        return { ...friendship, user: user ? toPublicUser(user) : null };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.delete('/api/friends/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFriend(userId, req.params.friendId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // Follow routes
  app.post('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      await storage.unfollowUser(followerId, followingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/followers/:userId', async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/following/:userId', async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Private message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertPrivateMessageSchema.parse({ ...req.body, senderId });
      const receiverId = messageData.receiverId;
      if (!receiverId) return res.status(400).json({ message: "receiverId required" });
      const targetSettings = await storage.getPrivacySettings(receiverId);
      const isFriend = await storage.areFriends(senderId, receiverId);
      if (!canSendDm(targetSettings, senderId, receiverId, isFriend)) {
        return res.status(403).json({ message: "User does not accept messages from you" });
      }
      const message = await storage.sendPrivateMessage(messageData);
      const sender = await storage.getUser(senderId);
      if (sender) {
        void notifyNewMessage(receiverId, sender, message.content);
      }
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      const { limit = 50 } = req.query;
      const messages = await storage.getPrivateMessages(currentUserId, otherUserId, Number(limit));
      const ids = messages.map((m) => m.id).filter(Boolean) as string[];
      const likeMeta = await storage.getPrivateMessageLikeMeta(ids, currentUserId);
      res.json(
        messages.map((m) => ({
          ...m,
          ...(likeMeta[m.id] ?? { likeCount: 0, likedByMe: false }),
        })),
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.patch('/api/messages/:messageId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      if (msg.senderId !== userId) return res.status(403).json({ message: "Only author can edit" });
      const { content } = updatePrivateMessageSchema.parse(req.body);
      const updated = await storage.updatePrivateMessage(req.params.messageId, content);
      const likeMeta = await storage.getPrivateMessageLikeMeta([req.params.messageId], userId);
      res.json({
        ...updated,
        ...(likeMeta[req.params.messageId] ?? { likeCount: 0, likedByMe: false }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content", errors: error.errors });
      }
      console.error("Error editing private message:", error);
      res.status(500).json({ message: "Failed to edit" });
    }
  });

  app.delete('/api/messages/:messageId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      if (msg.senderId !== userId) return res.status(403).json({ message: "Only author can delete" });
      await storage.deletePrivateMessage(req.params.messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting private message:", error);
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.post('/api/messages/:messageId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const meta = await storage.togglePrivateMessageLike(req.params.messageId, userId);
      res.json(meta);
    } catch (error) {
      console.error("Error toggling private like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(
        conversations.map((c) => ({
          ...c,
          user: toPublicUser(c.user),
        })),
      );
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.put('/api/messages/read/:senderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const senderId = req.params.senderId;
      await storage.markMessagesAsRead(userId, senderId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Travel post routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertTravelPostSchema.parse({ ...req.body, userId });
      const post = await storage.createTravelPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts', async (req: any, res) => {
    try {
      const { userId, following, tag, public: publicFilter, limit = 20, offset = 0 } = req.query;
      const currentUserId: string | null = req.user?.claims?.sub || null;
      const posts = await storage.getTravelPosts({
        userId: userId as string,
        following: following as string,
        tag: tag as string,
        publicOnly: publicFilter === "1" || publicFilter === "true",
        limit: Number(limit),
        offset: Number(offset),
      });
      const enriched = await Promise.all(posts.map(async (post) => {
        const author = post.userId ? await storage.getUser(post.userId) : null;
        const likesCount = await storage.getPostLikesCount(post.id);
        const commentsCount = await storage.getPostCommentsCount(post.id);
        const isLiked = currentUserId ? await storage.isPostLikedByUser(currentUserId, post.id) : false;
        return {
          ...post,
          author: author ? { id: author.id, firstName: author.firstName, lastName: author.lastName, profileImageUrl: author.profileImageUrl } : null,
          likesCount,
          commentsCount,
          isLiked,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', async (req: any, res) => {
    try {
      const post = await storage.getTravelPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const currentUserId: string | null = req.user?.claims?.sub || null;
      if (!post.isPublic && post.userId !== currentUserId) {
        return res.status(404).json({ message: "Post not found" });
      }
      const author = post.userId ? await storage.getUser(post.userId) : null;
      res.json({
        ...post,
        author: author
          ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              profileImageUrl: author.profileImageUrl,
            }
          : null,
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.put('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await storage.getTravelPost(req.params.id);
      if (!existing) return res.status(404).json({ message: "Post not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      const postData = updateTravelPostSchema.parse(req.body);
      const post = await storage.updateTravelPost(req.params.id, postData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await storage.getTravelPost(req.params.id);
      if (!existing) return res.status(404).json({ message: "Post not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteTravelPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Post interaction routes
  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const like = await storage.likePost(userId, postId);
      res.status(201).json(like);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      await storage.unlikePost(userId, postId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getTravelPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const commentData = insertPostCommentSchema.parse({ ...req.body, userId, postId });
      const comment = await storage.addPostComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comment = await storage.getPostComment(req.params.id);
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      if (comment.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deletePostComment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Account privacy (GDPR-style export / delete)
  app.get("/api/account/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = await storage.exportUserData(userId);
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="all-in-travel-export-${userId}.json"`,
      );
      res.json(data);
    } catch (error) {
      console.error("Error exporting account:", error);
      res.status(500).json({ message: "Failed to export account data" });
    }
  });

  app.delete("/api/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserAccount(userId);
      req.logout((err: unknown) => {
        if (err) console.error("Logout after account delete:", err);
        res.status(204).send();
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Search routes
  app.get('/api/search/users', async (req, res) => {
    try {
      const { q, limit = 20, exact, direction, travelStyle } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const viewerId = req.isAuthenticated() ? (req.user as SessionUser).claims.sub : undefined;
      const users = await storage.searchUsers(q as string, Number(limit), {
        viewerId,
        exact: exact === "1" || exact === "true",
        direction:
          typeof direction === "string" && isTravelDirectionId(direction) ? direction : undefined,
        travelStyle: typeof travelStyle === "string" ? travelStyle : undefined,
      });
      res.json(users.map(toPublicUser));
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  if (process.env.VERCEL) {
    return app as unknown as Server;
  }

  const httpServer = createServer(app);

  // WebSocket only for local/long-running Node server (not Vercel serverless)
  if (!process.env.VERCEL) {
  const { WebSocketServer, WebSocket } = await import("ws");
  const sessionParser = getSession();

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: InstanceType<typeof WebSocket>, req) => {
    let authenticatedUserId: string | null = null;

    const runSession = (cb: () => void) => {
      sessionParser(req as Request, {} as Response, () => {
        passport.initialize()(req as Request, {} as Response, () => {
          passport.session()(req as Request, {} as Response, cb);
        });
      });
    };

    runSession(() => {
      const user = (req as Request).user as SessionUser | undefined;
      authenticatedUserId = user?.claims?.sub ?? null;
      if (authenticatedUserId) {
        registerUserSocket(authenticatedUserId, ws);
        storage.touchPresence(authenticatedUserId, true).catch(() => {});
      }
    });

    ws.on('close', () => {
      if (authenticatedUserId) {
        unregisterUserSocket(authenticatedUserId, ws);
        storage.touchPresence(authenticatedUserId, false).catch(() => {});
      }
    });

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'chat_message') {
          const userId = authenticatedUserId;
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
            return;
          }
          const chatRoom = String(data.chatRoom ?? "");
          await storage.ensureLegacyChatRooms();
          const access = await resolveChatRoomAccess(storage, chatRoom, userId);
          if (!access.allowed) {
            ws.send(JSON.stringify({ type: 'error', message: access.reason }));
            return;
          }
          if (!access.canPost) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cannot post' }));
            return;
          }
          await ensureMemberForPost(storage, access.room, userId);
          const messageData = insertChatMessageSchema.parse({
            userId,
            content: data.content,
            chatRoom,
          });

          const savedMessage = await storage.createChatMessage(messageData);
          if (userId) await storage.touchPresence(userId, true);
          const sender = await storage.getUser(savedMessage.userId);

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: savedMessage,
                sender: sender ? toPublicUser(sender) : null,
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
        }));
      }
    });

  });
  }

  return httpServer;
}
