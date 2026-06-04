import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import type {
  ChatMessage,
  Event,
  EventRegistration,
  Friendship,
  InsertChatMessage,
  InsertEvent,
  InsertPlace,
  InsertPostComment,
  InsertPrivateMessage,
  InsertReview,
  InsertTravelPost,
  InsertTrip,
  InsertTripWaypoint,
  InsertUserProfile,
  Place,
  PostComment,
  PostLike,
  PrivateMessage,
  Review,
  TravelPost,
  Trip,
  TripParticipant,
  TripWaypoint,
  UpsertUser,
  User,
  UserFavorite,
  UserFollow,
  UserProfile,
} from "@shared/schema";
import {
  chatMessages,
  cities,
  events,
  eventRegistrations,
  friendships,
  places,
  postComments,
  postLikes,
  privateMessages,
  reviews,
  travelPosts,
  tripParticipants,
  trips,
  tripWaypoints,
  userFavorites,
  userFollows,
  userProfiles,
  users,
} from "@shared/schema";
import { getDb } from "./db";
import { buildSeedData } from "./seed-data";
import { resolveIsAdmin } from "./admin";
import type { IStorage } from "./storage";

type Db = NonNullable<ReturnType<typeof getDb>>;

export class PgStorage implements IStorage {
  private db: Db;

  constructor(db?: Db) {
    const instance = db ?? getDb();
    if (!instance) throw new Error("DATABASE_URL is required for PgStorage");
    this.db = instance;
  }

  async ensureSchema(): Promise<void> {
    await this.db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar`,
    );
    await this.db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false`,
    );
    await this.db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(30)`,
    );
    await this.db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar(64)`,
    );
    await this.db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username) WHERE username IS NOT NULL`,
    );
  }

  async ensureSeeded(): Promise<void> {
    await this.ensureSchema();
    const [{ value }] = await this.db.select({ value: count() }).from(places);
    if (Number(value) > 0) return;

    const seed = buildSeedData();
    await this.db.insert(users).values(seed.demoUser).onConflictDoNothing();
    await this.db.insert(places).values(
      seed.places.map((p) => ({
        ...p,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
      })),
    );
    await this.db.insert(events).values(
      seed.events.map((e) => ({
        ...e,
        organizerId: null,
        isActive: true,
      })),
    );
    await this.db.insert(trips).values(
      seed.trips.map((t) => ({ ...t, isActive: true })),
    );
    await this.db.insert(travelPosts).values(
      seed.posts.map((p) => ({
        ...p,
        isPublic: true,
        updatedAt: p.createdAt,
      })),
    );
    console.log("[PgStorage] Demo seed data inserted.");
  }

  async getUser(id: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const lower = email.trim().toLowerCase();
    const [row] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${lower}`)
      .limit(1);
    return row;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const lower = username.trim().toLowerCase().replace(/^@/, "");
    const [row] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = ${lower}`)
      .limit(1);
    return row;
  }

  async updateUserMe(
    userId: string,
    data: {
      displayName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string;
    },
  ): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async ensureUsernames(): Promise<void> {
    const { generateUniqueUsername } = await import("./user-utils");
    const rows = await this.db.select().from(users).where(isNull(users.username));
    for (const row of rows) {
      if (!row.email) continue;
      const username = await generateUniqueUsername(this, row.email);
      await this.db
        .update(users)
        .set({ username, updatedAt: new Date() })
        .where(eq(users.id, row.id));
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id as string;
    const adminFlag = resolveIsAdmin(userData.email ?? undefined);
    const payload = {
      ...userData,
      isAdmin: adminFlag || userData.isAdmin === true,
      updatedAt: new Date(),
    };
    const existing = await this.getUser(id);
    if (existing) {
      const [updated] = await this.db
        .update(users)
        .set(payload)
        .where(eq(users.id, id))
        .returning();
      return updated;
    }
    const [created] = await this.db
      .insert(users)
      .values({ ...payload, createdAt: new Date() } as typeof users.$inferInsert)
      .returning();
    return created;
  }

  async setUserAdmin(userId: string, isAdmin: boolean): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async ensureAdminUsers(): Promise<void> {
    const { getAdminEmails } = await import("./admin");
    for (const email of Array.from(getAdminEmails())) {
      const user = await this.getUserByEmail(email);
      if (user && !user.isAdmin) {
        await this.setUserAdmin(user.id, true);
        console.log(`[admin] Granted admin to ${email}`);
      }
    }
  }

  async setUserPassword(userId: string, passwordHash: string): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async getPlaces(filters?: {
    type?: string;
    search?: string;
    minRating?: number;
    priceRange?: string;
    limit?: number;
    offset?: number;
  }): Promise<Place[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(places.type, filters.type));
    if (filters?.search) {
      const term = filters.search.trim();
      const words = term
        .split(/[\s,;]+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2);
      const tokens = words.length > 0 ? words : [term];

      const tokenMatches = tokens.map((word) => {
        const q = `%${word}%`;
        return or(
          ilike(places.name, q),
          ilike(places.address, q),
          ilike(places.description, q),
        )!;
      });
      const placeMatch =
        tokenMatches.length === 1 ? tokenMatches[0]! : and(...tokenMatches)!;

      const cityQ = `%${tokens[0] ?? term}%`;
      const cityRows = await this.db
        .select({ name: cities.name })
        .from(cities)
        .where(or(ilike(cities.name, cityQ), ilike(cities.asciiName, cityQ))!)
        .orderBy(desc(cities.population))
        .limit(5);

      if (cityRows.length > 0) {
        const cityAddressMatch = or(
          ...cityRows.map((c) => ilike(places.address, `%${c.name}%`)),
        )!;
        conditions.push(or(placeMatch, cityAddressMatch)!);
      } else {
        conditions.push(placeMatch);
      }
    }
    if (filters?.minRating != null) {
      conditions.push(gte(places.averageRating, String(filters.minRating)));
    }
    if (filters?.priceRange) conditions.push(eq(places.priceRange, filters.priceRange));

    let query = this.db.select().from(places);
    if (conditions.length) query = query.where(and(...conditions)) as typeof query;

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }

  async getPlace(id: string): Promise<Place | undefined> {
    const [row] = await this.db.select().from(places).where(eq(places.id, id)).limit(1);
    return row;
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const [row] = await this.db
      .insert(places)
      .values({ ...place, reviewCount: 0, averageRating: "0" })
      .returning();
    return row;
  }

  async updatePlace(id: string, place: Partial<InsertPlace>): Promise<Place> {
    const [row] = await this.db
      .update(places)
      .set({ ...place, updatedAt: new Date() })
      .where(eq(places.id, id))
      .returning();
    if (!row) throw new Error("Place not found");
    return row;
  }

  async getReviewsByPlace(placeId: string): Promise<Review[]> {
    return this.db.select().from(reviews).where(eq(reviews.placeId, placeId));
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return this.db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [row] = await this.db.insert(reviews).values(review).returning();
    await this.updatePlaceRating(review.placeId);
    return row;
  }

  async updatePlaceRating(placeId: string): Promise<void> {
    const placeReviews = await this.getReviewsByPlace(placeId);
    if (!placeReviews.length) return;
    const avg = placeReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / placeReviews.length;
    await this.db
      .update(places)
      .set({ averageRating: avg.toFixed(1), reviewCount: placeReviews.length, updatedAt: new Date() })
      .where(eq(places.id, placeId));
  }

  async getTrips(filters?: {
    userId?: string;
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Trip[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(trips.userId, filters.userId));
    if (filters?.destination) conditions.push(ilike(trips.destination, `%${filters.destination}%`));
    if (filters?.startDate) conditions.push(gte(trips.startDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(trips.endDate, filters.endDate));

    let query = this.db.select().from(trips).orderBy(desc(trips.startDate));
    if (conditions.length) query = query.where(and(...conditions)) as typeof query;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [row] = await this.db.select().from(trips).where(eq(trips.id, id)).limit(1);
    return row;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [row] = await this.db
      .insert(trips)
      .values({ ...trip, currentParticipants: 1 })
      .returning();
    return row;
  }

  async joinTrip(tripId: string, userId: string): Promise<TripParticipant> {
    const [participant] = await this.db
      .insert(tripParticipants)
      .values({ tripId, userId, status: "confirmed" })
      .returning();
    await this.db
      .update(trips)
      .set({ currentParticipants: sql`${trips.currentParticipants} + 1`, updatedAt: new Date() })
      .where(eq(trips.id, tripId));
    return participant;
  }

  async getTripParticipants(tripId: string): Promise<TripParticipant[]> {
    return this.db.select().from(tripParticipants).where(eq(tripParticipants.tripId, tripId));
  }

  async getTripParticipationsByUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ tripId: tripParticipants.tripId })
      .from(tripParticipants)
      .where(eq(tripParticipants.userId, userId));
    return rows.map((r) => r.tripId);
  }

  async getTripWaypoints(tripId: string): Promise<(TripWaypoint & { place: Place | null })[]> {
    const waypoints = await this.db
      .select()
      .from(tripWaypoints)
      .where(eq(tripWaypoints.tripId, tripId))
      .orderBy(asc(tripWaypoints.orderIndex));
    return Promise.all(
      waypoints.map(async (w) => ({
        ...w,
        place: (await this.getPlace(w.placeId)) ?? null,
      })),
    );
  }

  async addTripWaypoint(
    tripId: string,
    placeId: string,
    orderIndex?: number,
    dayNumber?: number,
  ): Promise<TripWaypoint> {
    const existing = await this.db
      .select()
      .from(tripWaypoints)
      .where(eq(tripWaypoints.tripId, tripId));
    const nextOrder = orderIndex ?? existing.length;
    const [row] = await this.db
      .insert(tripWaypoints)
      .values({ tripId, placeId, orderIndex: nextOrder, dayNumber: dayNumber ?? null })
      .returning();
    return row;
  }

  async updateTripWaypoint(
    waypointId: string,
    data: { orderIndex?: number; dayNumber?: number },
  ): Promise<TripWaypoint | undefined> {
    const patch: Partial<{ orderIndex: number; dayNumber: number | null }> = {};
    if (data.orderIndex != null) patch.orderIndex = data.orderIndex;
    if (data.dayNumber != null) patch.dayNumber = data.dayNumber;
    const [row] = await this.db
      .update(tripWaypoints)
      .set(patch)
      .where(eq(tripWaypoints.id, waypointId))
      .returning();
    return row;
  }

  async removeTripWaypoint(waypointId: string): Promise<void> {
    await this.db.delete(tripWaypoints).where(eq(tripWaypoints.id, waypointId));
  }

  async getEvents(filters?: {
    type?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(events.type, filters.type));
    if (filters?.upcoming) conditions.push(gte(events.startDate, new Date()));

    let query = this.db.select().from(events).orderBy(asc(events.startDate));
    if (conditions.length) query = query.where(and(...conditions)) as typeof query;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [row] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    return row;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [row] = await this.db.insert(events).values(event).returning();
    return row;
  }

  async registerForEvent(eventId: string, userId: string): Promise<EventRegistration> {
    const existing = await this.isRegisteredForEvent(eventId, userId);
    if (existing) {
      const [row] = await this.db
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)))
        .limit(1);
      return row!;
    }
    const [row] = await this.db
      .insert(eventRegistrations)
      .values({ eventId, userId })
      .returning();
    return row;
  }

  async unregisterFromEvent(eventId: string, userId: string): Promise<void> {
    await this.db
      .delete(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)));
  }

  async getRegisteredEventIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ eventId: eventRegistrations.eventId })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.userId, userId));
    return rows.map((r) => r.eventId);
  }

  async isRegisteredForEvent(eventId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)))
      .limit(1);
    return Boolean(row);
  }

  async getChatMessages(chatRoom: string, limit = 50): Promise<ChatMessage[]> {
    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoom, chatRoom))
      .orderBy(asc(chatMessages.createdAt));
    return rows.slice(-limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [row] = await this.db.insert(chatMessages).values(message).returning();
    return row;
  }

  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return this.db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
  }

  async addFavorite(userId: string, placeId: string): Promise<UserFavorite> {
    const [row] = await this.db
      .insert(userFavorites)
      .values({ userId, placeId })
      .returning();
    return row;
  }

  async removeFavorite(userId: string, placeId: string): Promise<void> {
    await this.db
      .delete(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.placeId, placeId)));
  }

  async isFavorite(userId: string, placeId: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.placeId, placeId)))
      .limit(1);
    return Boolean(row);
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [row] = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return row;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [row] = await this.db.insert(userProfiles).values(profile).returning();
    return row;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      return this.createUserProfile({ userId, ...profile } as InsertUserProfile);
    }
    const [row] = await this.db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return row;
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [row] = await this.db
      .insert(friendships)
      .values({ requesterId, addresseeId, status: "pending" })
      .returning();
    return row;
  }

  async respondToFriendRequest(friendshipId: string, status: "accepted" | "rejected"): Promise<Friendship> {
    const [row] = await this.db
      .update(friendships)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    if (!row) throw new Error("Friendship not found");
    return row;
  }

  async getFriends(userId: string): Promise<User[]> {
    const accepted = await this.db
      .select()
      .from(friendships)
      .where(and(eq(friendships.status, "accepted"), or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))!));
    const friendIds = accepted.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
    if (!friendIds.length) return [];
    return this.db.select().from(users).where(inArray(users.id, friendIds));
  }

  async getFriendRequests(userId: string, type: "sent" | "received"): Promise<Friendship[]> {
    if (type === "sent") {
      return this.db
        .select()
        .from(friendships)
        .where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending")));
    }
    return this.db
      .select()
      .from(friendships)
      .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await this.db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
          and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId)),
        )!,
      );
  }

  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const [row] = await this.db.insert(userFollows).values({ followerId, followingId }).returning();
    return row;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
  }

  async getFollowers(userId: string): Promise<User[]> {
    const rows = await this.db.select().from(userFollows).where(eq(userFollows.followingId, userId));
    if (!rows.length) return [];
    return this.db.select().from(users).where(inArray(users.id, rows.map((r) => r.followerId)));
  }

  async getFollowing(userId: string): Promise<User[]> {
    const rows = await this.db.select().from(userFollows).where(eq(userFollows.followerId, userId));
    if (!rows.length) return [];
    return this.db.select().from(users).where(inArray(users.id, rows.map((r) => r.followingId)));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
      .limit(1);
    return Boolean(row);
  }

  async sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const [row] = await this.db.insert(privateMessages).values(message).returning();
    return row;
  }

  async getPrivateMessages(userId1: string, userId2: string, limit = 50): Promise<PrivateMessage[]> {
    const rows = await this.db
      .select()
      .from(privateMessages)
      .where(
        or(
          and(eq(privateMessages.senderId, userId1), eq(privateMessages.receiverId, userId2)),
          and(eq(privateMessages.senderId, userId2), eq(privateMessages.receiverId, userId1)),
        )!,
      )
      .orderBy(asc(privateMessages.createdAt));
    return rows.slice(-limit);
  }

  async getConversations(
    userId: string,
  ): Promise<{ user: User; lastMessage: PrivateMessage; unreadCount: number }[]> {
    const msgs = await this.db
      .select()
      .from(privateMessages)
      .where(or(eq(privateMessages.senderId, userId), eq(privateMessages.receiverId, userId))!)
      .orderBy(desc(privateMessages.createdAt));

    const partnerMap = new Map<string, PrivateMessage[]>();
    for (const m of msgs) {
      const partnerId = m.senderId === userId ? m.receiverId! : m.senderId!;
      if (!partnerMap.has(partnerId)) partnerMap.set(partnerId, []);
      partnerMap.get(partnerId)!.push(m);
    }

    const conversations: { user: User; lastMessage: PrivateMessage; unreadCount: number }[] = [];
    for (const [partnerId, thread] of Array.from(partnerMap.entries())) {
      const partner = await this.getUser(partnerId);
      if (!partner) continue;
      thread.sort(
        (a: PrivateMessage, b: PrivateMessage) =>
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime(),
      );
      const lastMessage = thread[thread.length - 1];
      const unreadCount = thread.filter(
        (m: PrivateMessage) => m.receiverId === userId && !m.isRead,
      ).length;
      conversations.push({ user: partner, lastMessage, unreadCount });
    }

    return conversations.sort(
      (a, b) => new Date(b.lastMessage.createdAt!).getTime() - new Date(a.lastMessage.createdAt!).getTime(),
    );
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await this.db
      .update(privateMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(privateMessages.receiverId, userId),
          eq(privateMessages.senderId, senderId),
          eq(privateMessages.isRead, false),
        ),
      );
  }

  async createTravelPost(post: InsertTravelPost): Promise<TravelPost> {
    const [row] = await this.db.insert(travelPosts).values(post).returning();
    return row;
  }

  async getTravelPosts(filters?: {
    userId?: string;
    following?: string;
    tag?: string;
    publicOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<TravelPost[]> {
    const conditions = [];
    if (filters?.publicOnly) conditions.push(eq(travelPosts.isPublic, true));
    if (filters?.userId) conditions.push(eq(travelPosts.userId, filters.userId));
    if (filters?.following) {
      const followingRows = await this.db
        .select({ id: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, filters.following));
      const ids = followingRows.map((r) => r.id);
      if (!ids.length) return [];
      conditions.push(inArray(travelPosts.userId, ids));
    }
    if (filters?.tag) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM unnest(${travelPosts.tags}) AS t(tag) WHERE lower(t.tag) = ${filters.tag.toLowerCase()})`,
      );
    }

    let query = this.db.select().from(travelPosts).orderBy(desc(travelPosts.createdAt));
    if (conditions.length) query = query.where(and(...conditions)) as typeof query;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }

  async getTravelPost(id: string): Promise<TravelPost | undefined> {
    const [row] = await this.db.select().from(travelPosts).where(eq(travelPosts.id, id)).limit(1);
    return row;
  }

  async updateTravelPost(id: string, post: Partial<InsertTravelPost>): Promise<TravelPost> {
    const [row] = await this.db
      .update(travelPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(travelPosts.id, id))
      .returning();
    if (!row) throw new Error("Post not found");
    return row;
  }

  async deleteTravelPost(id: string): Promise<void> {
    await this.db.delete(travelPosts).where(eq(travelPosts.id, id));
  }

  async likePost(userId: string, postId: string): Promise<PostLike> {
    const [row] = await this.db.insert(postLikes).values({ userId, postId }).returning();
    return row;
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await this.db.delete(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
  }

  async addPostComment(comment: InsertPostComment): Promise<PostComment> {
    const [row] = await this.db.insert(postComments).values(comment).returning();
    return row;
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    return this.db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));
  }

  async getPostComment(id: string): Promise<PostComment | undefined> {
    const [row] = await this.db.select().from(postComments).where(eq(postComments.id, id)).limit(1);
    return row;
  }

  async deletePostComment(id: string): Promise<void> {
    await this.db.delete(postComments).where(eq(postComments.id, id));
  }

  async searchUsers(query: string, limit = 10): Promise<User[]> {
    const term = query.trim().replace(/^@/, "");
    const q = `%${term}%`;
    return this.db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, q),
          ilike(users.displayName, q),
          ilike(users.firstName, q),
          ilike(users.lastName, q),
          ilike(users.email, q),
        )!,
      )
      .limit(limit);
  }

  async getPostLikesCount(postId: string): Promise<number> {
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));
    return Number(value);
  }

  async isPostLikedByUser(userId: string, postId: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .limit(1);
    return Boolean(row);
  }

  async getPostCommentsCount(postId: string): Promise<number> {
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(postComments)
      .where(eq(postComments.postId, postId));
    return Number(value);
  }

  async getUserTrips(userId: string): Promise<Trip[]> {
    return this.getTrips({ userId });
  }
}
