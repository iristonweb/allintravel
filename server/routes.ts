import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, getSession, type SessionUser } from "./auth";
import { authConfigPayload } from "./auth-readiness";
import { isGoogleAuthEnabled } from "./google-auth";
import passport from "passport";
import { allowGeoRequest } from "./geo/nominatim";
import {
  insertPlaceSchema,
  insertReviewSchema,
  insertEventSchema,
  insertChatMessageSchema,
  insertUserProfileSchema,
  insertPrivateMessageSchema,
  updateChatMessageSchema,
  updatePrivateMessageSchema,
  insertPostCommentSchema,
  updateTravelPostSchema,
  updateUserProfileSchema,
  insertUserTrackSchema,
} from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { validateUsername } from "@shared/username";
import { updatePrivacySettingsSchema } from "@shared/privacy";
import { isTravelDirectionId } from "@shared/travel-directions";
import { toPublicUser, toSelfUser } from "./user-utils";
import {
  getUploadsStaticDir,
  persistUploadedFile,
  assertPersistentMediaUrl,
  VERCEL_BLOB_REQUIRED_MSG,
} from "./media-storage";
import { createUploadMiddleware, handleMulter } from "./upload";
import { userCanManageTrip } from "./security";
import { searchLimiter, messagingLimiter } from "./rate-limit";
import { resolveChatRoomAccess, ensureMemberForPost } from "./chat-access";
import { validateChatMessageMediaContent } from "./chat-media-content";
import { importJamendoTrackToBlob, searchMusicCatalog, getItunesTrackById } from "./music-search";
import {
  canViewProfile,
  canSendDm,
  canSendFriendRequest,
  canSeeOnlineStatus,
} from "./privacy-helpers";
import { parseCreateTravelPostBody } from "./post-validation";
import {
  notifyFriendRequest,
  notifyFriendAccepted,
  notifyNewMessage,
  notifyTripJoin,
  notifyEventRegistration,
  notifyGroupJoin,
  notifyChatMessagePinned,
  notifyPostLiked,
  notifyPostCommented,
  notifyPrivateMessageReaction,
  notifyChatMessageReaction,
} from "./notification-service";
import { registerUserSocket, unregisterUserSocket } from "./realtime-hub";
import { registerAitRoutes } from "./ait/routes";
import {
  grantForChatMessage,
  grantForDmMessage,
  grantForFollow,
  grantForFriendAccepted,
  grantForPostCommented,
  grantForPostCreated,
  grantForPostLiked,
  tryProfileCompleteBonus,
  grantSpend,
  voidAit,
  type AitGrantResult,
} from "./ait/hooks";
import { NOTIFICATION_FILTERS, type NotificationFilter } from "@shared/notification-types";
import type { NotificationRow } from "@shared/schema";

async function mapNotificationsForClient(items: NotificationRow[]) {
  const actorIds = Array.from(
    new Set(items.map((n) => n.actorId).filter((id): id is string => Boolean(id))),
  );
  const users = await Promise.all(actorIds.map((id) => storage.getUser(id)));
  const actorMap = new Map(users.filter(Boolean).map((u) => [u!.id, toPublicUser(u!)] as const));
  return items.map((n) => ({
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
    actor: n.actorId ? (actorMap.get(n.actorId) ?? null) : null,
  }));
}

const updateUserMeSchema = z.object({
  displayName: z.string().max(64).nullable().optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  username: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  registerAitRoutes(app);

  // Geo autocomplete
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

  app.get("/api/search/destinations", searchLimiter, async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 10;
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(15, Math.floor(limitRaw)))
        : 10;
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
      const keywords = segments.length >= 2 ? segments[segments.length - 1]! : q;
      const locationHint = segments.length >= 2 ? segments.slice(0, -1).join(", ") : q;

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
      ...authConfigPayload(),
      googleOAuth: isGoogleAuthEnabled(),
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
      const aitGrant = await tryProfileCompleteBonus(userId, updated);
      res.json({ ...toSelfUser(updated), aitGrant: aitGrant ?? null });
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
      const { getUsersWithCreatorBadge } = await import("./ait/perks");
      const badges = await getUsersWithCreatorBadge([user.id]);
      const aitStore = await import("./ait/store");
      const bal = await aitStore.getOrCreateBalance(user.id);
      const { resolveCreatorRank } = await import("@shared/ait");
      res.json({
        ...toPublicUser(user),
        isOnline: showOnline ? (presence?.isOnline ?? false) : undefined,
        lastSeenAt: showOnline && settings.showLastSeen ? presence?.lastSeenAt : undefined,
        isFriend,
        creatorBadge: badges.has(user.id),
        creatorRank: resolveCreatorRank(bal.lifetimeCreatorEarned),
      });
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
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
      const userId = req.user.claims.sub as string;
      voidAit(import("./ait/service").then((m) => m.onDailyPulse(userId)));
      const isOnline = req.body?.isOnline !== false;
      const presence = await storage.touchPresence(userId, isOnline);
      res.json(presence);
    } catch (error) {
      console.error("Error updating presence:", error);
      res.status(500).json({ message: "Failed to update presence" });
    }
  });

  // Place routes
  app.get("/api/places", async (req, res) => {
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

  app.get("/api/places/:id", async (req, res) => {
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

  app.post("/api/places", isAuthenticated, async (req, res) => {
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
  app.get("/api/places/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByPlace(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/places/:id/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
        placeId: req.params.id,
      });
      const review = await storage.createReview(reviewData);
      const hasPhoto = Boolean(review.images?.length);
      const aitGrant = await grantSpend(userId, hasPhoto ? "review_photo" : "review", {
        entityType: "place",
        entityId: req.params.id,
      });
      res.status(201).json({ ...review, aitGrant: aitGrant ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // User reviews route
  app.get("/api/reviews/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await storage.getReviewsByUser(userId);
      const enriched = await Promise.all(
        reviews.map(async (review) => {
          const place = await storage.getPlace(review.placeId);
          return { ...review, place: place || null };
        }),
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
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

  app.get("/api/trips/my-participations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripIds = await storage.getTripParticipationsByUser(userId);
      res.json({ tripIds });
    } catch (error) {
      console.error("Error fetching my participations:", error);
      res.status(500).json({ message: "Failed to fetch participations" });
    }
  });

  app.get("/api/trips/:id/waypoints", async (req, res) => {
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
      const dayParam = req.query.day != null ? Number(req.query.day) : null;
      const waypoints = await storage.getTripWaypoints(req.params.id);
      const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      const filtered =
        dayParam != null && Number.isFinite(dayParam)
          ? sorted.filter((w) => w.dayNumber === dayParam)
          : sorted;
      const points = filtered
        .filter((w) => w.place?.latitude != null && w.place?.longitude != null)
        .map((w) => ({
          lat: Number(w.place!.latitude),
          lon: Number(w.place!.longitude),
        }));
      if (points.length < 2) {
        return res.json({ configured: true, route: null, message: "Need at least 2 stops" });
      }
      const modeParam = String(req.query.mode ?? "driving");
      const mode =
        modeParam === "walking" || modeParam === "transit" || modeParam === "driving"
          ? modeParam
          : "driving";
      const { buildRoute } = await import("./geo/yandex-router");
      const route = await buildRoute(points, mode);
      if (!route) {
        return res.json({
          configured: isYandexRouterConfigured(),
          route: null,
        });
      }
      res.json({
        configured: isYandexRouterConfigured(),
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

  app.get("/api/geo/route", async (req, res) => {
    try {
      const raw = String(req.query.points ?? "").trim();
      if (!raw) {
        return res.status(400).json({ message: "points query required (lat,lon|lat,lon|...)" });
      }
      const points = raw
        .split("|")
        .map((pair) => {
          const [latS, lonS] = pair.split(",").map((s) => s.trim());
          const lat = Number(latS);
          const lon = Number(lonS);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return { lat, lon };
        })
        .filter(Boolean) as Array<{ lat: number; lon: number }>;
      if (points.length < 2) {
        return res.status(400).json({ message: "Need at least 2 valid points" });
      }
      const modeParam = String(req.query.mode ?? "driving");
      const mode =
        modeParam === "walking" || modeParam === "transit" || modeParam === "driving"
          ? modeParam
          : "driving";
      const { buildRoute } = await import("./geo/yandex-router");
      const route = await buildRoute(points, mode);
      if (!route) {
        return res.json({ route: null });
      }
      res.json({
        route: {
          distanceKm: Math.round((route.distanceM / 1000) * 10) / 10,
          durationMin: Math.round(route.durationS / 60),
          geometry: route.geometry,
        },
      });
    } catch (error) {
      console.error("Error building geo route:", error);
      res.status(500).json({ message: "Failed to build route" });
    }
  });

  app.get("/api/geo/geocode", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (q.length < 2) return res.json(null);
      const acceptLanguage =
        (req.headers["accept-language"] as string | undefined) ??
        (typeof req.query.lang === "string" ? req.query.lang : undefined);
      const { resolveGeoAutocomplete } = await import("./geo/resolve-autocomplete");
      const { pickBestGeoMatch } = await import("./geo/geo-sort");
      const items = await resolveGeoAutocomplete({
        q,
        limit: 10,
        scope: "full",
        acceptLanguage,
      });
      const best = pickBestGeoMatch(q, items);
      if (best?.lat != null && best.lon != null) {
        return res.json({
          lat: Number(best.lat),
          lon: Number(best.lon),
          label: best.label,
        });
      }
      const { yandexForwardGeocode } = await import("./geo/yandex");
      const result = await yandexForwardGeocode(q);
      res.json(result);
    } catch (error) {
      console.error("Error geocoding:", error);
      res.status(500).json({ message: "Failed to geocode" });
    }
  });

  app.post("/api/trips/:id/waypoints", isAuthenticated, async (req: any, res) => {
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
        dayNumber != null ? Number(dayNumber) : undefined,
      );
      res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error adding waypoint:", error);
      res.status(500).json({ message: "Failed to add waypoint" });
    }
  });

  app.post("/api/trips/:id/waypoints/from-location", isAuthenticated, async (req: any, res) => {
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

      const name = label.length > 255 ? label.slice(0, 255) : label;
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

  app.patch("/api/trips/:id/waypoints/:waypointId", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/trips/:id/waypoints/:waypointId", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/trips/:id", async (req, res) => {
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

  app.put("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { parseUpdateTripBody } = await import("./trip-validation");
      const patch = parseUpdateTripBody(req.body);
      const trip = await storage.updateTrip(req.params.id, patch);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0]?.message ?? "Invalid trip data";
        return res.status(400).json({ message: first, errors: error.errors });
      }
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  app.post("/api/trips/:id/waypoints/distribute-days", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripId = req.params.id;
      if (!(await userCanManageTrip(storage, userId, tripId))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const waypoints = await storage.getTripWaypoints(tripId);
      if (waypoints.length === 0) return res.json({ updated: 0 });
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
      const perDay = Math.max(1, Math.ceil(waypoints.length / totalDays));
      const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      for (let i = 0; i < sorted.length; i++) {
        const dayNumber = Math.min(totalDays, Math.floor(i / perDay) + 1);
        await storage.updateTripWaypoint(sorted[i].id, { dayNumber, orderIndex: i });
      }
      const refreshed = await storage.getTripWaypoints(tripId);
      res.json({ updated: sorted.length, waypoints: refreshed });
    } catch (error) {
      console.error("Error distributing waypoints:", error);
      res.status(500).json({ message: "Failed to distribute stops" });
    }
  });

  app.get("/api/trips/:id/chat-room", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const isOwner = trip.userId === userId;
      const isMember = await storage.isTripParticipant(req.params.id, userId);
      if (!isOwner && !isMember) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { ensureTripChatRoom } = await import("./trip-hub");
      const withRoom = await ensureTripChatRoom(storage, trip);
      if (!withRoom.chatRoomId) {
        return res.status(500).json({ message: "Chat room unavailable" });
      }
      const room = await storage.getChatRoom(withRoom.chatRoomId);
      if (!room) return res.status(404).json({ message: "Chat room not found" });
      if (!(await storage.getChatRoomMember(room.id, userId))) {
        await storage.joinChatRoom(room.id, userId, "member");
      }
      res.json({ room, slug: room.slug });
    } catch (error) {
      console.error("Error fetching trip chat room:", error);
      res.status(500).json({ message: "Failed to fetch chat room" });
    }
  });

  app.get("/api/trips/:id/route-matches", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const canSee =
        trip.userId === userId || (await storage.isTripParticipant(req.params.id, userId));
      if (!canSee && !(await userCanManageTrip(storage, userId, req.params.id))) {
        const joined = await storage.getTripParticipationsByUser(userId);
        if (!joined.includes(req.params.id) && trip.userId !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      const baseWaypoints = await storage.getTripWaypoints(req.params.id);
      const { computeRouteOverlapPercent } = await import("./geo/trip-route-match");
      const allTrips = await storage.getTrips({ limit: 80 });
      const matches: {
        tripId: string;
        title: string;
        destination: string;
        overlapPercent: number;
        organizerId: string;
      }[] = [];
      for (const other of allTrips) {
        if (other.id === trip.id) continue;
        const otherWps = await storage.getTripWaypoints(other.id);
        if (otherWps.length < 2 || baseWaypoints.length < 2) continue;
        const overlapPercent = computeRouteOverlapPercent(baseWaypoints, otherWps);
        if (overlapPercent >= 25) {
          matches.push({
            tripId: other.id,
            title: other.title,
            destination: other.destination,
            overlapPercent,
            organizerId: other.userId,
          });
        }
      }
      matches.sort((a, b) => b.overlapPercent - a.overlapPercent);
      res.json({ matches: matches.slice(0, 12) });
    } catch (error) {
      console.error("Error computing route matches:", error);
      res.status(500).json({ message: "Failed to compute route matches" });
    }
  });

  app.get("/api/trips/:id/journal-template", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const dayParam = req.query.day != null ? Number(req.query.day) : null;
      const waypoints = await storage.getTripWaypoints(req.params.id);
      const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      const stops =
        dayParam != null && Number.isFinite(dayParam)
          ? sorted.filter((w) => w.dayNumber === dayParam)
          : sorted;
      const names = stops.map((w) => w.place?.name).filter(Boolean) as string[];
      const title = dayParam != null ? `${trip.title} — день ${dayParam}` : `Журнал: ${trip.title}`;
      const lines = [
        `# ${title}`,
        "",
        `**Направление:** ${trip.destination}`,
        dayParam != null ? `**День:** ${dayParam}` : "",
        "",
        "### Маршрут",
        ...(names.length ? names.map((n) => `- ${n}`) : ["- (добавьте остановки)"]),
        "",
        "### Впечатления",
        "Расскажите, что запомнилось в этот день…",
      ].filter(Boolean);
      res.json({
        tripId: trip.id,
        title,
        content: lines.join("\n"),
        format: "journal" as const,
        location: trip.destination,
      });
    } catch (error) {
      console.error("Error building journal template:", error);
      res.status(500).json({ message: "Failed to build journal template" });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { parseCreateTripBody } = await import("./trip-validation");
      const { tripData, inviteUserIds } = parseCreateTripBody(req.body, userId);
      let trip = await storage.createTrip(tripData);
      const { ensureTripChatRoom, inviteUsersToTrip } = await import("./trip-hub");
      trip = await ensureTripChatRoom(storage, trip);
      const { invited, skipped } = await inviteUsersToTrip(storage, trip, inviteUserIds, userId);
      const aitGrant = await grantSpend(userId, "trip_created", {
        entityType: "trip",
        entityId: trip.id,
      });
      let chatSlug: string | null = null;
      if (trip.chatRoomId) {
        const room = await storage.getChatRoom(trip.chatRoomId);
        chatSlug = room?.slug ?? null;
      }
      res.status(201).json({
        ...trip,
        chatSlug,
        invites: { invited, skipped },
        aitGrant: aitGrant ?? null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0]?.message ?? "Invalid trip data";
        return res.status(400).json({ message: first, errors: error.errors });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  app.post("/api/trips/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const participant = await storage.joinTrip(req.params.id, userId);
      const joiner = await storage.getUser(userId);
      if (joiner) void notifyTripJoin(trip.userId, joiner, trip.id, trip.title);
      res.status(201).json(participant);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to join trip";
      if (msg === "Trip is full") {
        return res.status(409).json({ message: "В поездке нет свободных мест" });
      }
      if (msg === "Trip not found") {
        return res.status(404).json({ message: "Trip not found" });
      }
      console.error("Error joining trip:", error);
      res.status(500).json({ message: "Failed to join trip" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { type, upcoming, limit = 20, offset = 0 } = req.query;
      const events = await storage.getEvents({
        type: type as string,
        upcoming: upcoming === "true",
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/events/registrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventIds = await storage.getRegisteredEventIds(userId);
      res.json({ eventIds });
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events/:id/register", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      const registration = await storage.registerForEvent(req.params.id, userId);
      const aitGrant = await grantSpend(userId, "event_register", {
        entityType: "event",
        entityId: req.params.id,
      });
      const registrant = await storage.getUser(userId);
      if (registrant) {
        void notifyEventRegistration(event.organizerId, registrant, event.id, event.title);
      }
      res.status(201).json({ ...registration, aitGrant: aitGrant ?? null });
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.delete("/api/events/:id/register", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unregisterFromEvent(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unregistering from event:", error);
      res.status(500).json({ message: "Failed to unregister" });
    }
  });

  app.get("/api/trips/:id/participants", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/music/tracks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tracks = await storage.listUserTracks(userId);
      res.json(tracks);
    } catch (error) {
      console.error("Error listing music tracks:", error);
      res.status(500).json({ message: "Failed to list tracks" });
    }
  });

  app.post("/api/music/tracks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = insertUserTrackSchema.parse({ ...req.body, userId });
      const track = await storage.createUserTrack(body);
      const aitGrant = await grantSpend(userId, "music_upload", {
        entityType: "track",
        entityId: track.id,
      });
      res.status(201).json({ ...track, aitGrant: aitGrant ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid track data", errors: error.errors });
      }
      console.error("Error creating music track:", error);
      res.status(500).json({ message: "Failed to create track" });
    }
  });

  app.get("/api/music/search", isAuthenticated, async (req: any, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (q.length < 2) {
        return res.json({ jamendo: [], itunes: [] });
      }
      const results = await searchMusicCatalog(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching music:", error);
      res.status(500).json({ message: "Failed to search music" });
    }
  });

  const importTrackSchema = z.object({
    source: z.enum(["jamendo", "itunes"]),
    externalId: z.string().min(1).max(100),
  });

  app.post("/api/music/tracks/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = importTrackSchema.parse(req.body);

      if (body.source === "jamendo") {
        const imported = await importJamendoTrackToBlob(body.externalId);
        const track = await storage.createUserTrack({
          userId,
          title: imported.title,
          fileUrl: imported.fileUrl,
          mimeType: imported.mimeType,
          fileSizeBytes: imported.fileSizeBytes,
          durationSeconds: imported.durationSeconds,
          artist: imported.artist,
          sourceProvider: "jamendo",
          sourceId: imported.sourceId,
          license: imported.license ?? undefined,
          isPreview: false,
        });
        return res.status(201).json(track);
      }

      const itunes = await getItunesTrackById(body.externalId);
      if (!itunes) return res.status(404).json({ message: "Трек не найден" });
      const track = await storage.createUserTrack({
        userId,
        title: itunes.title.slice(0, 200),
        fileUrl: itunes.previewUrl,
        mimeType: "audio/mpeg",
        durationSeconds: 30,
        artist: itunes.artist.slice(0, 200),
        sourceProvider: "itunes",
        sourceId: itunes.id,
        isPreview: true,
      });
      res.status(201).json(track);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error importing music track:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to import track",
      });
    }
  });

  app.delete("/api/music/tracks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const track = await storage.getUserTrack(req.params.id);
      if (!track) return res.status(404).json({ message: "Track not found" });
      if (track.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteUserTrack(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting music track:", error);
      res.status(500).json({ message: "Failed to delete track" });
    }
  });

  app.get("/api/music/tracks/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const track = await storage.getUserTrack(req.params.id);
      if (!track) return res.status(404).json({ message: "Track not found" });
      if (track.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      const ext = path.extname(track.fileUrl) || ".mp3";
      const safeTitle = track.title.replace(/[^\w\s.-]/g, "").trim() || "track";
      const filename = `${safeTitle}${ext}`;

      if (track.fileUrl.startsWith("/uploads/")) {
        const localPath = path.join(getUploadsStaticDir(), path.basename(track.fileUrl));
        if (!fs.existsSync(localPath)) {
          return res.status(404).json({ message: "File not found" });
        }
        return res.download(localPath, filename);
      }

      const remote = await fetch(track.fileUrl);
      if (!remote.ok) {
        return res.status(502).json({ message: "Failed to fetch file" });
      }
      const buffer = Buffer.from(await remote.arrayBuffer());
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      res.setHeader(
        "Content-Type",
        track.mimeType || remote.headers.get("content-type") || "audio/mpeg",
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error downloading music track:", error);
      res.status(500).json({ message: "Failed to download track" });
    }
  });

  app.get("/api/follow/:userId/check", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const isFollowing = await storage.isFollowing(followerId, req.params.userId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limitRaw = parseInt(String(req.query.limit ?? "30"), 10);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 30;
      const cursor =
        typeof req.query.cursor === "string" && req.query.cursor.length > 0
          ? req.query.cursor
          : null;
      const filterRaw = String(req.query.filter ?? "all");
      const filter: NotificationFilter = (NOTIFICATION_FILTERS as readonly string[]).includes(
        filterRaw,
      )
        ? (filterRaw as NotificationFilter)
        : "all";

      const [receivedRequests, conversations, page, unreadNotifs] = await Promise.all([
        storage.getFriendRequests(userId, "received"),
        storage.getConversations(userId),
        storage.getNotificationsPage(userId, { limit, cursor, filter }),
        storage.getUnreadNotificationCount(userId),
      ]);
      const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      const items = await mapNotificationsForClient(page.items);
      res.json({
        friendRequests: receivedRequests.length,
        unreadMessages,
        unreadNotifications: unreadNotifs,
        totalUnread: unreadNotifs + receivedRequests.length + unreadMessages,
        items,
        nextCursor: page.nextCursor,
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

  app.post("/api/admin/broadcasts", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = z
        .object({
          content: z.string().min(1).max(8000),
          expiresAt: z.coerce.date().optional(),
        })
        .parse(req.body);
      validateChatMessageMediaContent(body.content);
      const broadcast = await storage.createAdminBroadcast({
        createdBy: userId,
        content: body.content,
        isActive: true,
        expiresAt: body.expiresAt ?? null,
      });
      const { broadcastToUser } = await import("./realtime-hub");
      const userIds = await storage.getAllUserIds();
      const { sendPushToUsers, plainTextPreview } = await import("./push");
      const preview = plainTextPreview(body.content, 160);
      for (const uid of userIds) {
        broadcastToUser(uid, {
          type: "broadcast_published",
          broadcast: {
            id: broadcast.id,
            content: broadcast.content,
            createdAt: broadcast.createdAt?.toISOString() ?? new Date().toISOString(),
          },
        });
      }
      void sendPushToUsers(userIds, {
        title: "Объявление All In Travel",
        body: preview || "Новое сообщение от команды",
        url: "/",
        tag: `broadcast-${broadcast.id}`,
        soundKind: "default",
      }).catch((err) => console.error("Broadcast push:", err));
      res.status(201).json(broadcast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid broadcast", errors: error.errors });
      }
      console.error("Error creating broadcast:", error);
      res.status(500).json({ message: "Failed to create broadcast" });
    }
  });

  app.get("/api/admin/broadcasts", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const broadcasts = await storage.getAdminBroadcasts();
      res.json(broadcasts);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      res.status(500).json({ message: "Failed to fetch broadcasts" });
    }
  });

  app.get("/api/admin/ait/transactions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { adminRecentTransactions } = await import("./ait/admin");
      const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 40));
      const rows = await adminRecentTransactions(limit);
      const enriched = await Promise.all(
        rows.map(async (t) => {
          const user = await storage.getUser(t.userId);
          return {
            id: t.id,
            userId: t.userId,
            wallet: t.wallet,
            delta: t.delta,
            reasonCode: t.reasonCode,
            title: t.title,
            createdAt: t.createdAt.toISOString(),
            userLabel: user
              ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
              : t.userId,
            username: user?.username ?? null,
          };
        }),
      );
      res.json({ transactions: enriched });
    } catch (error) {
      console.error("GET /api/admin/ait/transactions", error);
      res.status(500).json({ message: "Failed to load transactions" });
    }
  });

  app.get("/api/admin/ait/search", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (q.length < 2) return res.json({ users: [] });
      const adminId = req.user.claims.sub as string;
      const users = await storage.searchUsers(q, 12, { viewerId: adminId });
      const aitStore = await import("./ait/store");
      const list = await Promise.all(
        users.map(async (u) => {
          const bal = await aitStore.getOrCreateBalance(u.id);
          return {
            id: u.id,
            email: u.email,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            spendBalance: bal.spendBalance,
            creatorBalance: bal.creatorBalance,
          };
        }),
      );
      res.json({ users: list });
    } catch (error) {
      console.error("GET /api/admin/ait/search", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/admin/ait/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { adminGetUserAit } = await import("./ait/admin");
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const ait = await adminGetUserAit(user.id);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ait,
      });
    } catch (error) {
      console.error("GET /api/admin/ait/users/:id", error);
      res.status(500).json({ message: "Failed to load user AIT" });
    }
  });

  app.post("/api/admin/ait/adjust", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub as string;
      const body = z
        .object({
          userId: z.string().min(1),
          wallet: z.enum(["spend", "creator"]),
          delta: z.number().int(),
          note: z.string().max(200).optional(),
          sendPush: z.boolean().optional(),
        })
        .parse(req.body);
      const { adminAdjustAit } = await import("./ait/admin");
      const result = await adminAdjustAit(
        adminId,
        body.userId,
        body.wallet,
        body.delta,
        body.note ?? "",
        { sendPush: body.sendPush !== false },
      );
      if (!result.ok) return res.status(400).json({ message: result.message });
      const { adminGetUserAit } = await import("./ait/admin");
      res.json({
        ok: true,
        grant: result.grant,
        aitGrant: result.grant ?? null,
        ait: await adminGetUserAit(body.userId),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid body" });
      }
      console.error("POST /api/admin/ait/adjust", error);
      res.status(500).json({ message: "Adjust failed" });
    }
  });

  app.post("/api/admin/push/user", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const body = z
        .object({
          userId: z.string().min(1),
          title: z.string().min(1).max(120),
          body: z.string().min(1).max(300),
          url: z.string().max(200).optional(),
        })
        .parse(req.body);
      const { sendPushToUser } = await import("./push");
      await sendPushToUser(body.userId, {
        title: body.title,
        body: body.body,
        url: body.url ?? "/",
        soundKind: "default",
      });
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid body" });
      }
      res.status(500).json({ message: "Push failed" });
    }
  });

  app.get("/api/broadcasts/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const broadcast = await storage.getPendingAdminBroadcast(userId);
      res.json(broadcast ?? null);
    } catch (error) {
      console.error("Error fetching pending broadcast:", error);
      res.status(500).json({ message: "Failed to fetch broadcast" });
    }
  });

  app.post("/api/broadcasts/:id/dismiss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = z.object({ action: z.enum(["ack", "skip_video"]) }).parse(req.body);
      await storage.dismissAdminBroadcast(req.params.id, userId, body.action);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid dismiss action", errors: error.errors });
      }
      console.error("Error dismissing broadcast:", error);
      res.status(500).json({ message: "Failed to dismiss broadcast" });
    }
  });

  const avatarUrlSchema = z
    .string()
    .max(2048)
    .refine((u) => !u.startsWith("data:"), { message: "Data URLs are not allowed" })
    .optional();

  const createRoomSchema = z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    avatarUrl: avatarUrlSchema,
    visibility: z.enum(["public", "private"]),
    slug: z.string().max(100).optional(),
  });

  const patchRoomSchema = createRoomSchema.partial().extend({
    settings: z
      .object({
        slowModeSeconds: z.number().int().min(0).max(3600).optional(),
        whoCanInvite: z.enum(["everyone", "admins"]).optional(),
        whoCanPost: z.enum(["everyone", "members"]).optional(),
        autoJoinOnPost: z.boolean().optional(),
        chatBackground: z
          .enum(["default", "aurora", "ocean", "sunset", "forest", "midnight", "lavender"])
          .optional(),
      })
      .optional(),
  });

  const isRoomAdmin = async (roomId: string, userId: string) => {
    const room = await storage.getChatRoom(roomId);
    if (room?.createdBy === userId) return true;
    const m = await storage.getChatRoomMember(roomId, userId);
    return m?.status === "active" && (m.role === "admin" || m.role === "owner");
  };

  app.get("/api/chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.ensureLegacyChatRooms();
      const rooms = await storage.listChatRoomsForUser(userId);
      const { getRoomOwnersWithSpotlight, sortRoomsWithSpotlight } = await import("./ait/perks");
      const owners = rooms.map((r) => r.createdBy).filter(Boolean) as string[];
      const spotlight = await getRoomOwnersWithSpotlight(owners);
      res.json(sortRoomsWithSpotlight(rooms, spotlight));
    } catch (error) {
      console.error("Error listing chat rooms:", error);
      res.status(500).json({ message: "Failed to list rooms" });
    }
  });

  const roomAvatarUpload = createUploadMiddleware();

  async function saveRoomAvatarFromFile(file: Express.Multer.File): Promise<string> {
    const mime = file.mimetype || "";
    if (!mime.startsWith("image/")) {
      throw new Error("Аватар должен быть изображением (JPG, PNG, WebP, GIF)");
    }
    const url = await persistUploadedFile(file);
    assertPersistentMediaUrl(url);
    if (url.startsWith("data:")) {
      throw new Error(VERCEL_BLOB_REQUIRED_MSG);
    }
    return url;
  }

  app.post(
    "/api/chat/rooms",
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, roomAvatarUpload.single("file")),
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const body = createRoomSchema.parse({
          title: req.body?.title,
          description: req.body?.description || undefined,
          visibility: req.body?.visibility,
          avatarUrl: req.body?.avatarUrl,
          slug: req.body?.slug,
        });
        let avatarUrl = body.avatarUrl;
        let avatarWarning: string | undefined;
        if (req.file) {
          try {
            avatarUrl = await saveRoomAvatarFromFile(req.file);
          } catch (e) {
            avatarWarning = e instanceof Error ? e.message : "Не удалось загрузить аватар";
          }
        }
        const room = await storage.createChatRoom({
          title: body.title,
          description: body.description,
          avatarUrl,
          visibility: body.visibility,
          ...(body.slug ? { slug: body.slug } : {}),
          createdBy: userId,
        });
        const aitGrant = await grantSpend(userId, "chat_room_created", {
          entityType: "chat_room",
          entityId: room.id,
        });
        res
          .status(201)
          .json({ room, aitGrant: aitGrant ?? null, ...(avatarWarning ? { avatarWarning } : {}) });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid room data", errors: error.errors });
        }
        console.error("Error creating chat room:", error);
        res.status(500).json({ message: "Failed to create room" });
      }
    },
  );

  app.get("/api/chat/rooms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.getChatRoom(req.params.id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const access = await resolveChatRoomAccess(storage, room.slug, userId);
      if (!access.allowed) return res.status(403).json({ message: access.reason });
      const members = await storage.getChatRoomMembers(room.id);
      const pinnedIds = await storage.getPinnedMessageIds(room.id);
      res.json({
        ...room,
        memberCount: members.length,
        members,
        pinnedMessageIds: pinnedIds,
        myRole: (await storage.getChatRoomMember(room.id, userId))?.role ?? null,
      });
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
      const patch = patchRoomSchema.parse(req.body);
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

  app.post("/api/chat/rooms/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = req.params.id;
      if (!(await isRoomAdmin(roomId, userId))) {
        return res.status(403).json({ message: "Admin only" });
      }
      const body = z.object({ userId: z.string().min(1) }).parse(req.body);
      const room = await storage.getChatRoom(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const target = await storage.getUser(body.userId);
      if (!target) return res.status(404).json({ message: "User not found" });
      const member = await storage.joinChatRoom(roomId, body.userId);
      res.status(201).json({ ...member, user: toPublicUser(target) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding room member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.patch("/api/chat/rooms/:id/members/:memberUserId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = req.params.id;
      const memberUserId = req.params.memberUserId;
      const room = await storage.getChatRoom(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const myMember = await storage.getChatRoomMember(roomId, userId);
      if (myMember?.role !== "owner") {
        return res.status(403).json({ message: "Owner only" });
      }
      const targetMember = await storage.getChatRoomMember(roomId, memberUserId);
      if (!targetMember || targetMember.status !== "active") {
        return res.status(404).json({ message: "Member not found" });
      }
      if (targetMember.role === "owner") {
        return res.status(400).json({ message: "Cannot change owner role" });
      }
      const body = z.object({ role: z.enum(["admin", "member"]) }).parse(req.body);
      const updated = await storage.setChatRoomMemberRole(roomId, memberUserId, body.role);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete(
    "/api/chat/rooms/:id/members/:memberUserId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const roomId = req.params.id;
        const memberUserId = req.params.memberUserId;
        const room = await storage.getChatRoom(roomId);
        if (!room) return res.status(404).json({ message: "Room not found" });
        const targetMember = await storage.getChatRoomMember(roomId, memberUserId);
        if (!targetMember) return res.status(404).json({ message: "Member not found" });
        if (targetMember.role === "owner") {
          return res.status(400).json({ message: "Cannot remove owner" });
        }
        const isSelf = memberUserId === userId;
        if (!isSelf && !(await isRoomAdmin(roomId, userId))) {
          return res.status(403).json({ message: "Admin only" });
        }
        await storage.banChatRoomMember(roomId, memberUserId);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing room member:", error);
        res.status(500).json({ message: "Failed to remove member" });
      }
    },
  );

  const canManageChatMessage = async (roomId: string, messageId: string, userId: string) => {
    const msg = await storage.getChatMessage(messageId);
    if (!msg) return { ok: false as const, status: 404, message: "Message not found" };
    if (msg.userId === userId) return { ok: true as const, msg };
    if (await isRoomAdmin(roomId, userId)) return { ok: true as const, msg };
    return { ok: false as const, status: 403, message: "Forbidden" };
  };

  app.post(
    "/api/chat/rooms/:roomId/messages/:messageId/pin",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const access = await canManageChatMessage(req.params.roomId, req.params.messageId, userId);
        if (!access.ok) return res.status(access.status).json({ message: access.message });
        await storage.pinChatMessage(req.params.roomId, req.params.messageId, userId);
        const room = await storage.getChatRoom(req.params.roomId);
        const pinner = await storage.getUser(userId);
        if (room && pinner) {
          const members = await storage.getChatRoomMembers(req.params.roomId);
          const memberIds = members.map((m) => m.userId);
          const preview = access.msg.content.replace(/\[[^\]]+\]/g, "").trim() || "Сообщение";
          void notifyChatMessagePinned(
            memberIds,
            pinner,
            room.title,
            room.slug,
            req.params.messageId,
            preview,
          );
          const { broadcastToUser } = await import("./realtime-hub");
          for (const m of members) {
            broadcastToUser(m.userId, {
              type: "message_pinned",
              roomId: req.params.roomId,
              roomSlug: room.slug,
              messageId: req.params.messageId,
            });
          }
        }
        res.status(204).send();
      } catch (error) {
        console.error("Error pinning message:", error);
        res.status(500).json({ message: "Failed to pin" });
      }
    },
  );

  app.delete(
    "/api/chat/rooms/:roomId/messages/:messageId/pin",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const access = await canManageChatMessage(req.params.roomId, req.params.messageId, userId);
        if (!access.ok) return res.status(access.status).json({ message: access.message });
        await storage.unpinChatMessage(req.params.roomId, req.params.messageId);
        const room = await storage.getChatRoom(req.params.roomId);
        if (room) {
          const { broadcastToUser } = await import("./realtime-hub");
          const members = await storage.getChatRoomMembers(req.params.roomId);
          for (const m of members) {
            broadcastToUser(m.userId, {
              type: "message_unpinned",
              roomId: req.params.roomId,
              roomSlug: room.slug,
              messageId: req.params.messageId,
            });
          }
        }
        res.status(204).send();
      } catch (error) {
        console.error("Error unpinning message:", error);
        res.status(500).json({ message: "Failed to unpin" });
      }
    },
  );

  app.delete(
    "/api/chat/rooms/:roomId/messages/:messageId",
    isAuthenticated,
    async (req: any, res) => {
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
    },
  );

  app.patch(
    "/api/chat/rooms/:roomId/messages/:messageId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const msg = await storage.getChatMessage(req.params.messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });
        if (msg.userId !== userId) return res.status(403).json({ message: "Only author can edit" });
        const { content } = updateChatMessageSchema.parse(req.body);
        const updated = await storage.updateChatMessage(req.params.messageId, content);
        const sender = await storage.getUser(userId);
        const likeMeta = await storage.getChatMessageReactionsMeta([req.params.messageId], userId);
        const meta = likeMeta[req.params.messageId] ?? { reactions: [] };
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
    },
  );

  app.post(
    "/api/chat/rooms/:roomId/messages/:messageId/like",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const msg = await storage.getChatMessage(req.params.messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });
        const existing = await storage.getChatMessageReactionsMeta([req.params.messageId], userId);
        const mine = existing[req.params.messageId]?.reactions.find((r) => r.reactedByMe);
        const adding = mine?.emoji !== "❤️";
        const meta = await storage.setChatMessageReaction(
          req.params.messageId,
          userId,
          mine?.emoji === "❤️" ? null : "❤️",
        );
        if (adding && msg.userId && msg.userId !== userId) {
          const reactor = await storage.getUser(userId);
          const room = await storage.getChatRoom(req.params.roomId);
          if (reactor) {
            void notifyChatMessageReaction(
              msg.userId,
              reactor,
              req.params.messageId,
              room?.slug ?? msg.chatRoom,
              room?.title ?? msg.chatRoom,
              "❤️",
              msg.content,
            ).catch((err) => console.error("[notify] chat reaction:", err));
          }
        }
        res.json(meta);
      } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Failed to toggle like" });
      }
    },
  );

  app.put(
    "/api/chat/rooms/:roomId/messages/:messageId/reactions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const msg = await storage.getChatMessage(req.params.messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });
        const body = z.object({ emoji: z.string().min(1).max(16).nullable() }).parse(req.body);
        const meta = await storage.setChatMessageReaction(req.params.messageId, userId, body.emoji);
        if (body.emoji && msg.userId && msg.userId !== userId) {
          const reactor = await storage.getUser(userId);
          const room = await storage.getChatRoom(req.params.roomId);
          if (reactor) {
            void notifyChatMessageReaction(
              msg.userId,
              reactor,
              req.params.messageId,
              room?.slug ?? msg.chatRoom,
              room?.title ?? msg.chatRoom,
              body.emoji,
              msg.content,
            ).catch((err) => console.error("[notify] chat reaction:", err));
          }
        }
        const { broadcastToUser } = await import("./realtime-hub");
        const members = await storage.getChatRoomMembers(req.params.roomId);
        for (const m of members) {
          if (m.userId !== userId) {
            broadcastToUser(m.userId, {
              type: "reaction_updated",
              roomId: req.params.roomId,
              messageId: req.params.messageId,
              reactions: meta.reactions,
            });
          }
        }
        res.json(meta);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid reaction", errors: error.errors });
        }
        console.error("Error setting reaction:", error);
        res.status(500).json({ message: "Failed to set reaction" });
      }
    },
  );

  app.get(
    "/api/chat/rooms/:roomId/messages/:messageId/insights",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const room = await storage.getChatRoom(req.params.roomId);
        if (!room) return res.status(404).json({ message: "Room not found" });
        const access = await resolveChatRoomAccess(storage, room.slug, userId);
        if (!access.allowed) return res.status(403).json({ message: access.reason });
        const msg = await storage.getChatMessage(req.params.messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });
        const readers = await storage.getChatMessageReaders(
          room.id,
          req.params.messageId,
          msg.userId ?? undefined,
        );
        const reactionGroups = await storage.getChatMessageReactionDetails(req.params.messageId);
        res.json({
          readCount: readers.length,
          readers: readers.map(toPublicUser),
          reactions: reactionGroups.map((g) => ({
            emoji: g.emoji,
            users: g.users.map(toPublicUser),
          })),
        });
      } catch (error) {
        console.error("Error fetching message insights:", error);
        res.status(500).json({ message: "Failed to fetch insights" });
      }
    },
  );

  app.post("/api/chat/rooms/:roomId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = req.params.roomId;
      const room = await storage.getChatRoom(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const access = await resolveChatRoomAccess(storage, room.slug, userId);
      if (!access.allowed) return res.status(403).json({ message: access.reason });
      const body = z.object({ messageId: z.string().uuid() }).parse(req.body);
      await storage.upsertChatRoomReadCursor(roomId, userId, body.messageId);
      const { broadcastToUser } = await import("./realtime-hub");
      const members = await storage.getChatRoomMembers(roomId);
      for (const m of members) {
        if (m.userId !== userId) {
          broadcastToUser(m.userId, {
            type: "read_cursor_updated",
            roomId,
            userId,
            messageId: body.messageId,
          });
        }
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating read cursor:", error);
      res.status(500).json({ message: "Failed to update read cursor" });
    }
  });

  // Chat routes (HTTP fallback for Vercel — WebSocket is not available on serverless)
  const enrichChatMessages = async (
    messages: Awaited<ReturnType<typeof storage.getChatMessages>>,
    viewerId: string,
    roomId?: string,
  ) => {
    const ids = messages.map((m) => m.id).filter(Boolean) as string[];
    const reactionMeta = await storage.getChatMessageReactionsMeta(ids, viewerId);
    const ownIds = messages
      .filter((m) => m.userId === viewerId && m.id)
      .map((m) => m.id!) as string[];
    const readMeta =
      roomId && ownIds.length > 0
        ? await storage.getChatMessageReadMeta(roomId, ownIds, viewerId)
        : {};
    return Promise.all(
      messages.map(async (msg) => {
        const sender = msg.userId ? await storage.getUser(msg.userId) : null;
        const reactions = reactionMeta[msg.id] ?? { reactions: [] };
        const read = msg.id && msg.userId === viewerId ? readMeta[msg.id] : undefined;
        return {
          ...msg,
          ...reactions,
          ...(read ?? {}),
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
      const withSenders = await enrichChatMessages(messages, userId, access.room?.id);
      const pinnedIds = access.room ? await storage.getPinnedMessageIds(access.room.id) : [];
      res.json({ messages: withSenders, pinnedMessageIds: pinnedIds, room: access.room });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/:room", messagingLimiter, isAuthenticated, async (req: any, res) => {
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
      const mediaError = validateChatMessageMediaContent(content);
      if (mediaError) {
        return res.status(400).json({ message: mediaError });
      }
      const messageData = insertChatMessageSchema.parse({
        userId,
        content,
        chatRoom: room,
      });
      const savedMessage = await storage.createChatMessage(messageData);
      const aitGrant = await grantForChatMessage(userId, content, room);
      const sender = await storage.getUser(userId);
      res.status(201).json({
        ...savedMessage,
        aitGrant: aitGrant ?? null,
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
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      const enriched = await Promise.all(
        favorites.map(async (fav) => {
          const place = await storage.getPlace(fav.placeId);
          return { ...fav, place: place || null };
        }),
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:placeId", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/favorites/:placeId", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/favorites/:placeId/check", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/profile/:userId", async (req, res) => {
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

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/friends/request/:userId", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/friends/respond/:friendshipId", isAuthenticated, async (req: any, res) => {
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
      const friendship = await storage.respondToFriendRequest(
        req.params.friendshipId,
        status,
        direction,
      );
      if (status === "accepted") {
        const accepter = await storage.getUser(userId);
        if (accepter) {
          void notifyFriendAccepted(storage, friendship.requesterId, accepter, friendship.id);
        }
        const aitGrant = await grantForFriendAccepted(
          friendship.requesterId,
          friendship.addresseeId,
        );
        res.json({ ...friendship, aitGrant: aitGrant ?? null });
        return;
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

  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/friends/requests/:type", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.params.type as "sent" | "received";
      const requests = await storage.getFriendRequests(userId, type);
      const enriched = await Promise.all(
        requests.map(async (friendship) => {
          const otherUserId = type === "sent" ? friendship.addresseeId : friendship.requesterId;
          const user = await storage.getUser(otherUserId);
          return { ...friendship, user: user ? toPublicUser(user) : null };
        }),
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.delete("/api/friends/:friendId", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/follow/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      const follow = await storage.followUser(followerId, followingId);
      const aitGrant = await grantForFollow(followerId, followingId);
      res.status(201).json({ ...follow, aitGrant: aitGrant ?? null });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/follow/:userId", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/followers/:userId", async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/following/:userId", async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Private message routes
  app.post("/api/messages", messagingLimiter, isAuthenticated, async (req: any, res) => {
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
      const mediaError = validateChatMessageMediaContent(messageData.content);
      if (mediaError) {
        return res.status(400).json({ message: mediaError });
      }
      const message = await storage.sendPrivateMessage(messageData);
      const aitGrant = await grantForDmMessage(senderId, message.content, receiverId);
      const sender = await storage.getUser(senderId);
      if (sender) {
        void notifyNewMessage(receiverId, sender, message.content);
      }
      res.status(201).json({ ...message, aitGrant: aitGrant ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      const { limit = 50 } = req.query;
      await storage.markPrivateMessagesDelivered(currentUserId, otherUserId);
      const messages = await storage.getPrivateMessages(currentUserId, otherUserId, Number(limit));
      const ids = messages.map((m) => m.id).filter(Boolean) as string[];
      const reactionMeta = await storage.getPrivateMessageReactionsMeta(ids, currentUserId);
      res.json(
        messages.map((m) => {
          const reactions = reactionMeta[m.id] ?? { reactions: [] };
          const deliveryStatus =
            m.senderId === currentUserId
              ? m.isRead
                ? "read"
                : m.deliveredAt
                  ? "delivered"
                  : "sent"
              : undefined;
          return {
            ...m,
            ...reactions,
            ...(deliveryStatus ? { deliveryStatus } : {}),
          };
        }),
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.patch("/api/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      if (msg.senderId !== userId) return res.status(403).json({ message: "Only author can edit" });
      const { content } = updatePrivateMessageSchema.parse(req.body);
      const updated = await storage.updatePrivateMessage(req.params.messageId, content);
      const likeMeta = await storage.getPrivateMessageReactionsMeta([req.params.messageId], userId);
      res.json({
        ...updated,
        ...(likeMeta[req.params.messageId] ?? { reactions: [] }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content", errors: error.errors });
      }
      console.error("Error editing private message:", error);
      res.status(500).json({ message: "Failed to edit" });
    }
  });

  app.delete("/api/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      if (msg.senderId !== userId)
        return res.status(403).json({ message: "Only author can delete" });
      await storage.deletePrivateMessage(req.params.messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting private message:", error);
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.post("/api/messages/:messageId/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const existing = await storage.getPrivateMessageReactionsMeta([req.params.messageId], userId);
      const mine = existing[req.params.messageId]?.reactions.find((r) => r.reactedByMe);
      const adding = mine?.emoji !== "❤️";
      const meta = await storage.setPrivateMessageReaction(
        req.params.messageId,
        userId,
        mine?.emoji === "❤️" ? null : "❤️",
      );
      if (adding && msg.senderId !== userId) {
        const reactor = await storage.getUser(userId);
        const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (reactor && partnerId) {
          void notifyPrivateMessageReaction(
            msg.senderId,
            reactor,
            req.params.messageId,
            partnerId,
            "❤️",
            msg.content,
          ).catch((err) => console.error("[notify] dm reaction:", err));
        }
      }
      res.json(meta);
    } catch (error) {
      console.error("Error toggling private like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.put("/api/messages/:messageId/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const body = z.object({ emoji: z.string().min(1).max(16).nullable() }).parse(req.body);
      const meta = await storage.setPrivateMessageReaction(
        req.params.messageId,
        userId,
        body.emoji,
      );
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (body.emoji && msg.senderId !== userId && partnerId) {
        const reactor = await storage.getUser(userId);
        if (reactor) {
          void notifyPrivateMessageReaction(
            msg.senderId,
            reactor,
            req.params.messageId,
            partnerId,
            body.emoji,
            msg.content,
          ).catch((err) => console.error("[notify] dm reaction:", err));
        }
      }
      if (partnerId) {
        const { broadcastToUser } = await import("./realtime-hub");
        broadcastToUser(partnerId, {
          type: "reaction_updated",
          messageId: req.params.messageId,
          reactions: meta.reactions,
        });
      }
      res.json(meta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reaction", errors: error.errors });
      }
      console.error("Error setting private reaction:", error);
      res.status(500).json({ message: "Failed to set reaction" });
    }
  });

  app.get("/api/messages/:messageId/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      if (msg.senderId !== userId && msg.receiverId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = partnerId ? await storage.getUser(partnerId) : null;
      const readers = msg.isRead && partner ? [partner] : [];
      const reactionGroups = await storage.getPrivateMessageReactionDetails(req.params.messageId);
      res.json({
        readCount: readers.length,
        readers: readers.map(toPublicUser),
        reactions: reactionGroups.map((g) => ({
          emoji: g.emoji,
          users: g.users.map(toPublicUser),
        })),
      });
    } catch (error) {
      console.error("Error fetching private message insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      const enriched = await Promise.all(
        conversations.map(async (c) => {
          const settings = await storage.getPrivacySettings(c.user.id);
          const isFriend = await storage.areFriends(userId, c.user.id);
          const presence = await storage.getPresence(c.user.id);
          const showOnline = canSeeOnlineStatus(settings, userId, c.user.id, isFriend);
          return {
            ...c,
            user: {
              ...toPublicUser(c.user),
              isOnline: showOnline ? (presence?.isOnline ?? false) : undefined,
            },
          };
        }),
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.put("/api/messages/read/:senderId", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = parseCreateTravelPostBody(req.body, userId);
      const post = await storage.createTravelPost(postData);
      const aitGrant = await grantForPostCreated(
        userId,
        post.format ?? "post",
        post.content,
        post.images,
        post.id,
      );
      res.status(201).json({ ...post, aitGrant: aitGrant ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", async (req: any, res) => {
    try {
      const {
        userId,
        following,
        tag,
        format,
        public: publicFilter,
        limit = 20,
        offset = 0,
      } = req.query;
      const currentUserId: string | null = req.user?.claims?.sub || null;
      const posts = await storage.getTravelPosts({
        userId: userId as string,
        following: following as string,
        tag: tag as string,
        format: format as string | undefined,
        publicOnly: publicFilter === "1" || publicFilter === "true",
        limit: Number(limit),
        offset: Number(offset),
      });
      const { getActiveBoostedPostIds, getUsersWithCreatorBadge, sortPostsWithBoosts } =
        await import("./ait/perks");
      const boosted = await getActiveBoostedPostIds();
      const enriched = await Promise.all(
        posts.map(async (post) => {
          const author = post.userId ? await storage.getUser(post.userId) : null;
          const likesCount = await storage.getPostLikesCount(post.id);
          const commentsCount = await storage.getPostCommentsCount(post.id);
          const isLiked = currentUserId
            ? await storage.isPostLikedByUser(currentUserId, post.id)
            : false;
          return {
            ...post,
            author: author
              ? {
                  id: author.id,
                  firstName: author.firstName,
                  lastName: author.lastName,
                  profileImageUrl: author.profileImageUrl,
                }
              : null,
            likesCount,
            commentsCount,
            isLiked,
            isBoosted: boosted.has(post.id),
          };
        }),
      );
      const authorIds = enriched.map((p) => p.userId).filter(Boolean) as string[];
      const badges = await getUsersWithCreatorBadge(authorIds);
      const withBadges = enriched.map((p) => ({
        ...p,
        creatorBadge: p.userId ? badges.has(p.userId) : false,
      }));
      res.json(sortPostsWithBoosts(withBadges, boosted));
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req: any, res) => {
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
      const likesCount = await storage.getPostLikesCount(post.id);
      const commentsCount = await storage.getPostCommentsCount(post.id);
      const isLiked = currentUserId
        ? await storage.isPostLikedByUser(currentUserId, post.id)
        : false;
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
        likesCount,
        commentsCount,
        isLiked,
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.put("/api/posts/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/posts/:id", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getTravelPost(postId);
      const like = await storage.likePost(userId, postId);
      let aitGrant: AitGrantResult | null = null;
      if (post?.userId) {
        const g = await grantForPostLiked(userId, post.userId, postId);
        aitGrant = g.authorGrant;
        const liker = await storage.getUser(userId);
        if (liker && post.content) {
          void notifyPostLiked(post.userId, liker, postId, post.content).catch((err) =>
            console.error("[notify] post like:", err),
          );
        }
      }
      res.status(201).json({ ...like, aitGrant });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getTravelPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const commentData = insertPostCommentSchema.parse({ ...req.body, userId, postId });
      const comment = await storage.addPostComment(commentData);
      let aitGrant: AitGrantResult | null = null;
      if (post.userId) {
        const g = await grantForPostCommented(userId, post.userId, postId, comment.content);
        aitGrant = g.commenterGrant;
        const commenter = await storage.getUser(userId);
        if (commenter) {
          void notifyPostCommented(
            post.userId,
            commenter,
            postId,
            post.content ?? "",
            comment.content,
          ).catch((err) => console.error("[notify] post comment:", err));
        }
      }
      res.status(201).json({ ...comment, aitGrant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/search/users", searchLimiter, async (req, res) => {
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

    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    wss.on("connection", (ws: InstanceType<typeof WebSocket>, req) => {
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

      ws.on("close", () => {
        if (authenticatedUserId) {
          unregisterUserSocket(authenticatedUserId, ws);
          storage.touchPresence(authenticatedUserId, false).catch(() => {});
        }
      });

      ws.on("message", async (message: string) => {
        try {
          const data = JSON.parse(message);

          if (data.type === "chat_message") {
            const userId = authenticatedUserId;
            if (!userId) {
              ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
              return;
            }
            const chatRoom = String(data.chatRoom ?? "");
            await storage.ensureLegacyChatRooms();
            const access = await resolveChatRoomAccess(storage, chatRoom, userId);
            if (!access.allowed) {
              ws.send(JSON.stringify({ type: "error", message: access.reason }));
              return;
            }
            if (!access.canPost) {
              ws.send(JSON.stringify({ type: "error", message: "Cannot post" }));
              return;
            }
            await ensureMemberForPost(storage, access.room, userId);
            const content = String(data.content ?? "").trim();
            if (!content) {
              ws.send(JSON.stringify({ type: "error", message: "Content is required" }));
              return;
            }
            const mediaError = validateChatMessageMediaContent(content);
            if (mediaError) {
              ws.send(JSON.stringify({ type: "error", message: mediaError }));
              return;
            }
            const messageData = insertChatMessageSchema.parse({
              userId,
              content,
              chatRoom,
            });

            const savedMessage = await storage.createChatMessage(messageData);
            if (userId) await storage.touchPresence(userId, true);
            const sender = await storage.getUser(savedMessage.userId);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "new_message",
                    message: savedMessage,
                    sender: sender ? toPublicUser(sender) : null,
                  }),
                );
              }
            });
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to process message",
            }),
          );
        }
      });
    });
  }

  return httpServer;
}
