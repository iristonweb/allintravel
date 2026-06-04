import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession, type SessionUser } from "./auth";
import { isGoogleAuthEnabled } from "./google-auth";
import passport from "passport";
import { allowGeoRequest, nominatimAutocomplete } from "./geo/nominatim";
import { isYandexGeocoderConfigured, yandexAutocomplete } from "./geo/yandex";
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
  insertTravelPostSchema,
  insertPostLikeSchema,
  insertPostCommentSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Geo autocomplete
  app.get("/api/geo/autocomplete", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 8;
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10, Math.floor(limitRaw))) : 8;
      const scopeRaw = typeof req.query.scope === "string" ? req.query.scope : "all";
      const scope = scopeRaw === "city" || scopeRaw === "country" || scopeRaw === "all" ? scopeRaw : "all";

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

      // Prefer local DB-backed autocomplete when Postgres is configured.
      if (process.env.DATABASE_URL) {
        try {
          const mod = await import("./geo/db-autocomplete");
          const items = await mod.dbGeoAutocomplete({ q, limit, scope });
          return res.json(items);
        } catch (e) {
          console.warn("DB geo autocomplete failed; falling back to Nominatim.", e);
        }
      }

      const acceptLanguage =
        (req.headers["accept-language"] as string | undefined) ??
        (typeof req.query.lang === "string" ? req.query.lang : undefined);

      if (isYandexGeocoderConfigured()) {
        try {
          const items = await yandexAutocomplete({ q, limit, acceptLanguage: acceptLanguage ?? null });
          if (items.length > 0) return res.json(items);
        } catch (e) {
          console.warn("Yandex geocoder autocomplete failed; falling back.", e);
        }
      }

      const items = await nominatimAutocomplete({ q, limit, acceptLanguage: acceptLanguage ?? null });
      return res.json(items);
    } catch (error) {
      console.error("Error fetching geo autocomplete:", error);
      res.status(500).json({ message: "Failed to fetch geo autocomplete" });
    }
  });

  app.get("/api/auth/config", (_req, res) => {
    res.json({
      googleOAuth: isGoogleAuthEnabled(),
      /** First login with email + access code creates the account (no separate signup page). */
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
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.post('/api/trips/:id/waypoints', isAuthenticated, async (req: any, res) => {
    try {
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

  app.patch('/api/trips/:id/waypoints/:waypointId', isAuthenticated, async (req, res) => {
    try {
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

  app.delete('/api/trips/:id/waypoints/:waypointId', isAuthenticated, async (req, res) => {
    try {
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
      const participant = await storage.joinTrip(req.params.id, userId);
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

  app.get('/api/trips/:id/participants', async (req, res) => {
    try {
      const participants = await storage.getTripParticipants(req.params.id);
      const enriched = await Promise.all(
        participants.map(async (p) => ({
          ...p,
          user: p.userId ? await storage.getUser(p.userId) : null,
        })),
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
      const [receivedRequests, conversations] = await Promise.all([
        storage.getFriendRequests(userId, "received"),
        storage.getConversations(userId),
      ]);
      const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      res.json({
        friendRequests: receivedRequests.length,
        unreadMessages,
        items: [
          ...receivedRequests.map((r) => ({
            type: "friend_request" as const,
            id: r.id,
            message: "Новый запрос в друзья",
          })),
          ...conversations
            .filter((c) => c.unreadCount > 0)
            .map((c) => ({
              type: "message" as const,
              id: c.user.id,
              message: `Непрочитанных: ${c.unreadCount} от ${c.user.firstName || "пользователя"}`,
            })),
        ],
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Chat routes (HTTP fallback for Vercel — WebSocket is not available on serverless)
  const enrichChatMessages = async (messages: Awaited<ReturnType<typeof storage.getChatMessages>>) =>
    Promise.all(
      messages.map(async (msg) => {
        const sender = msg.userId ? await storage.getUser(msg.userId) : null;
        return {
          ...msg,
          sender: sender
            ? {
                id: sender.id,
                firstName: sender.firstName,
                lastName: sender.lastName,
                profileImageUrl: sender.profileImageUrl,
              }
            : null,
        };
      }),
    );

  app.get("/api/chat/:room", async (req, res) => {
    try {
      const { room } = req.params;
      const { limit = 50 } = req.query;
      const messages = await storage.getChatMessages(room, Number(limit));
      const withSenders = await enrichChatMessages(messages);
      res.json(withSenders.reverse());
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/:room", isAuthenticated, async (req: any, res) => {
    try {
      const { room } = req.params;
      const userId = req.user.claims.sub;
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
      const profile = await storage.getUserProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
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
      const profileData = req.body;
      const profile = await storage.updateUserProfile(userId, profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Friend routes
  app.post('/api/friends/request/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const addresseeId = req.params.userId;
      const friendship = await storage.sendFriendRequest(requesterId, addresseeId);
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put('/api/friends/respond/:friendshipId', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const friendship = await storage.respondToFriendRequest(req.params.friendshipId, status);
      res.json(friendship);
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
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
        return { ...friendship, user: user || null };
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
      const message = await storage.sendPrivateMessage(messageData);
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
      res.json(messages.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
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
      const { userId, following, tag, limit = 20, offset = 0 } = req.query;
      const currentUserId: string | null = req.user?.claims?.sub || null;
      const posts = await storage.getTravelPosts({
        userId: userId as string,
        following: following as string,
        tag: tag as string,
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

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const post = await storage.getTravelPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
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
      const post = await storage.updateTravelPost(req.params.id, req.body);
      res.json(post);
    } catch (error) {
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

  // Search routes
  app.get('/api/search/users', async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const users = await storage.searchUsers(q as string, Number(limit));
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  const httpServer = createServer(app);
  const sessionParser = getSession();

  // WebSocket setup for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
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
    });

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'chat_message') {
          const userId = authenticatedUserId ?? data.userId;
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
            return;
          }
          const messageData = insertChatMessageSchema.parse({
            userId,
            content: data.content,
            chatRoom: data.chatRoom,
          });

          const savedMessage = await storage.createChatMessage(messageData);
          const sender = await storage.getUser(savedMessage.userId);

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: savedMessage,
                sender: sender ? { id: sender.id, firstName: sender.firstName, lastName: sender.lastName, profileImageUrl: sender.profileImageUrl } : null,
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

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
