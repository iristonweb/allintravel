var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  cities: () => cities,
  countries: () => countries,
  eventRegistrations: () => eventRegistrations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  friendships: () => friendships,
  friendshipsRelations: () => friendshipsRelations,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertEventSchema: () => insertEventSchema,
  insertFriendshipSchema: () => insertFriendshipSchema,
  insertPlaceSchema: () => insertPlaceSchema,
  insertPostCommentSchema: () => insertPostCommentSchema,
  insertPostLikeSchema: () => insertPostLikeSchema,
  insertPrivateMessageSchema: () => insertPrivateMessageSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertTravelPostSchema: () => insertTravelPostSchema,
  insertTripSchema: () => insertTripSchema,
  insertTripWaypointSchema: () => insertTripWaypointSchema,
  insertUserFollowSchema: () => insertUserFollowSchema,
  insertUserProfileSchema: () => insertUserProfileSchema,
  places: () => places,
  placesRelations: () => placesRelations,
  postComments: () => postComments,
  postCommentsRelations: () => postCommentsRelations,
  postLikes: () => postLikes,
  postLikesRelations: () => postLikesRelations,
  privateMessages: () => privateMessages,
  privateMessagesRelations: () => privateMessagesRelations,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  sessions: () => sessions,
  travelPosts: () => travelPosts,
  travelPostsRelations: () => travelPostsRelations,
  tripParticipants: () => tripParticipants,
  tripParticipantsRelations: () => tripParticipantsRelations,
  tripWaypoints: () => tripWaypoints,
  tripWaypointsRelations: () => tripWaypointsRelations,
  trips: () => trips,
  tripsRelations: () => tripsRelations,
  userFavorites: () => userFavorites,
  userFavoritesRelations: () => userFavoritesRelations,
  userFollows: () => userFollows,
  userFollowsRelations: () => userFollowsRelations,
  userProfiles: () => userProfiles,
  userProfilesRelations: () => userProfilesRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var countries, cities, sessions, users, places, reviews, trips, tripParticipants, tripWaypoints, events, eventRegistrations, chatMessages, userFavorites, friendships, userFollows, privateMessages, travelPosts, postLikes, postComments, userProfiles, usersRelations, placesRelations, reviewsRelations, tripsRelations, tripParticipantsRelations, tripWaypointsRelations, eventsRelations, chatMessagesRelations, userFavoritesRelations, friendshipsRelations, userFollowsRelations, privateMessagesRelations, travelPostsRelations, postLikesRelations, postCommentsRelations, userProfilesRelations, insertPlaceSchema, insertReviewSchema, insertTripSchema, insertTripWaypointSchema, insertEventSchema, insertChatMessageSchema, insertUserProfileSchema, insertFriendshipSchema, insertUserFollowSchema, insertPrivateMessageSchema, insertTravelPostSchema, insertPostLikeSchema, insertPostCommentSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    countries = pgTable(
      "countries",
      {
        code: varchar("code", { length: 2 }).primaryKey(),
        // ISO2
        name: varchar("name", { length: 128 }).notNull(),
        capitalName: varchar("capital_name", { length: 128 }),
        continent: varchar("continent", { length: 2 }),
        currency: varchar("currency", { length: 3 }),
        phone: varchar("phone", { length: 32 })
      },
      (t) => [index("IDX_countries_name").on(t.name)]
    );
    cities = pgTable(
      "cities",
      {
        geonameId: integer("geoname_id").primaryKey(),
        name: varchar("name", { length: 200 }).notNull(),
        asciiName: varchar("ascii_name", { length: 200 }),
        countryCode: varchar("country_code", { length: 2 }).notNull(),
        admin1: varchar("admin1", { length: 20 }),
        latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
        longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
        population: integer("population").default(0),
        featureClass: varchar("feature_class", { length: 1 }),
        featureCode: varchar("feature_code", { length: 10 })
      },
      (t) => [
        index("IDX_cities_country_code").on(t.countryCode),
        index("IDX_cities_population").on(t.population),
        index("IDX_cities_name").on(t.name),
        index("IDX_cities_ascii_name").on(t.asciiName)
      ]
    );
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique(),
      username: varchar("username", { length: 30 }).unique(),
      displayName: varchar("display_name", { length: 64 }),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      passwordHash: varchar("password_hash"),
      isVerified: boolean("is_verified").default(false),
      isAdmin: boolean("is_admin").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    places = pgTable("places", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      type: varchar("type", { length: 50 }).notNull(),
      // restaurant, hotel, attraction
      latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
      longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
      address: text("address"),
      phone: varchar("phone", { length: 20 }),
      website: varchar("website"),
      priceRange: varchar("price_range", { length: 10 }),
      // $, $$, $$$, $$$$
      cuisine: varchar("cuisine", { length: 50 }),
      // for restaurants
      amenities: text("amenities").array(),
      // for hotels
      imageUrl: varchar("image_url"),
      averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
      reviewCount: integer("review_count").default(0),
      isVerified: boolean("is_verified").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    reviews = pgTable("reviews", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
      rating: integer("rating").notNull(),
      // 1-5 stars
      title: varchar("title", { length: 255 }),
      content: text("content"),
      images: text("images").array(),
      isHelpful: integer("is_helpful").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    trips = pgTable("trips", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      destination: varchar("destination", { length: 255 }).notNull(),
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      maxParticipants: integer("max_participants").default(5),
      currentParticipants: integer("current_participants").default(1),
      budgetMin: integer("budget_min"),
      budgetMax: integer("budget_max"),
      tags: text("tags").array(),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    tripParticipants = pgTable("trip_participants", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      status: varchar("status", { length: 20 }).default("pending"),
      // pending, accepted, rejected
      joinedAt: timestamp("joined_at").defaultNow()
    });
    tripWaypoints = pgTable("trip_waypoints", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
      placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
      orderIndex: integer("order_index").notNull().default(0),
      dayNumber: integer("day_number"),
      createdAt: timestamp("created_at").defaultNow()
    });
    events = pgTable("events", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      type: varchar("type", { length: 50 }).notNull(),
      // festival, food, music, etc.
      location: varchar("location", { length: 255 }),
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date"),
      price: integer("price"),
      // in cents
      imageUrl: varchar("image_url"),
      organizerId: varchar("organizer_id").references(() => users.id),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    eventRegistrations = pgTable("event_registrations", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow()
    });
    chatMessages = pgTable("chat_messages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      chatRoom: varchar("chat_room", { length: 100 }).notNull(),
      // e.g., "general", "rome", "paris"
      createdAt: timestamp("created_at").defaultNow()
    });
    userFavorites = pgTable("user_favorites", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow()
    });
    friendships = pgTable("friendships", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      status: varchar("status", { length: 20 }).default("pending"),
      // pending, accepted, blocked
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userFollows = pgTable("user_follows", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow()
    });
    privateMessages = pgTable("private_messages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      isRead: boolean("is_read").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    travelPosts = pgTable("travel_posts", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      content: text("content").notNull(),
      images: text("images").array(),
      location: varchar("location", { length: 255 }),
      latitude: decimal("latitude", { precision: 10, scale: 7 }),
      longitude: decimal("longitude", { precision: 10, scale: 7 }),
      tags: text("tags").array(),
      isPublic: boolean("is_public").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    postLikes = pgTable("post_likes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      postId: uuid("post_id").notNull().references(() => travelPosts.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow()
    });
    postComments = pgTable("post_comments", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      postId: uuid("post_id").notNull().references(() => travelPosts.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userProfiles = pgTable("user_profiles", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
      bio: text("bio"),
      location: varchar("location", { length: 255 }),
      website: varchar("website"),
      travelStyle: varchar("travel_style", { length: 100 }),
      // adventurous, cultural, relaxation, etc.
      favoriteDestinations: text("favorite_destinations").array(),
      languages: text("languages").array(),
      interests: text("interests").array(),
      isPublic: boolean("is_public").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersRelations = relations(users, ({ one, many }) => ({
      reviews: many(reviews),
      trips: many(trips),
      tripParticipants: many(tripParticipants),
      chatMessages: many(chatMessages),
      favorites: many(userFavorites),
      profile: one(userProfiles),
      sentFriendRequests: many(friendships, { relationName: "requester" }),
      receivedFriendRequests: many(friendships, { relationName: "addressee" }),
      followers: many(userFollows, { relationName: "following" }),
      following: many(userFollows, { relationName: "follower" }),
      sentMessages: many(privateMessages, { relationName: "sender" }),
      receivedMessages: many(privateMessages, { relationName: "receiver" }),
      travelPosts: many(travelPosts),
      postLikes: many(postLikes),
      postComments: many(postComments)
    }));
    placesRelations = relations(places, ({ many }) => ({
      reviews: many(reviews),
      favorites: many(userFavorites)
    }));
    reviewsRelations = relations(reviews, ({ one }) => ({
      user: one(users, { fields: [reviews.userId], references: [users.id] }),
      place: one(places, { fields: [reviews.placeId], references: [places.id] })
    }));
    tripsRelations = relations(trips, ({ one, many }) => ({
      user: one(users, { fields: [trips.userId], references: [users.id] }),
      participants: many(tripParticipants),
      waypoints: many(tripWaypoints)
    }));
    tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
      trip: one(trips, { fields: [tripParticipants.tripId], references: [trips.id] }),
      user: one(users, { fields: [tripParticipants.userId], references: [users.id] })
    }));
    tripWaypointsRelations = relations(tripWaypoints, ({ one }) => ({
      trip: one(trips, { fields: [tripWaypoints.tripId], references: [trips.id] }),
      place: one(places, { fields: [tripWaypoints.placeId], references: [places.id] })
    }));
    eventsRelations = relations(events, ({ one }) => ({
      organizer: one(users, { fields: [events.organizerId], references: [users.id] })
    }));
    chatMessagesRelations = relations(chatMessages, ({ one }) => ({
      user: one(users, { fields: [chatMessages.userId], references: [users.id] })
    }));
    userFavoritesRelations = relations(userFavorites, ({ one }) => ({
      user: one(users, { fields: [userFavorites.userId], references: [users.id] }),
      place: one(places, { fields: [userFavorites.placeId], references: [places.id] })
    }));
    friendshipsRelations = relations(friendships, ({ one }) => ({
      requester: one(users, { fields: [friendships.requesterId], references: [users.id], relationName: "requester" }),
      addressee: one(users, { fields: [friendships.addresseeId], references: [users.id], relationName: "addressee" })
    }));
    userFollowsRelations = relations(userFollows, ({ one }) => ({
      follower: one(users, { fields: [userFollows.followerId], references: [users.id], relationName: "follower" }),
      following: one(users, { fields: [userFollows.followingId], references: [users.id], relationName: "following" })
    }));
    privateMessagesRelations = relations(privateMessages, ({ one }) => ({
      sender: one(users, { fields: [privateMessages.senderId], references: [users.id], relationName: "sender" }),
      receiver: one(users, { fields: [privateMessages.receiverId], references: [users.id], relationName: "receiver" })
    }));
    travelPostsRelations = relations(travelPosts, ({ one, many }) => ({
      user: one(users, { fields: [travelPosts.userId], references: [users.id] }),
      likes: many(postLikes),
      comments: many(postComments)
    }));
    postLikesRelations = relations(postLikes, ({ one }) => ({
      user: one(users, { fields: [postLikes.userId], references: [users.id] }),
      post: one(travelPosts, { fields: [postLikes.postId], references: [travelPosts.id] })
    }));
    postCommentsRelations = relations(postComments, ({ one }) => ({
      user: one(users, { fields: [postComments.userId], references: [users.id] }),
      post: one(travelPosts, { fields: [postComments.postId], references: [travelPosts.id] })
    }));
    userProfilesRelations = relations(userProfiles, ({ one }) => ({
      user: one(users, { fields: [userProfiles.userId], references: [users.id] })
    }));
    insertPlaceSchema = createInsertSchema(places).omit({
      id: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true
    });
    insertReviewSchema = createInsertSchema(reviews).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTripSchema = createInsertSchema(trips).omit({
      id: true,
      currentParticipants: true,
      createdAt: true,
      updatedAt: true
    });
    insertTripWaypointSchema = createInsertSchema(tripWaypoints).omit({
      id: true,
      createdAt: true
    });
    insertEventSchema = createInsertSchema(events).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertChatMessageSchema = createInsertSchema(chatMessages).omit({
      id: true,
      createdAt: true
    });
    insertUserProfileSchema = createInsertSchema(userProfiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertFriendshipSchema = createInsertSchema(friendships).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserFollowSchema = createInsertSchema(userFollows).omit({
      id: true,
      createdAt: true
    });
    insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({
      id: true,
      createdAt: true
    });
    insertTravelPostSchema = createInsertSchema(travelPosts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPostLikeSchema = createInsertSchema(postLikes).omit({
      id: true,
      createdAt: true
    });
    insertPostCommentSchema = createInsertSchema(postComments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  getDb: () => getDb,
  getPool: () => getPool,
  getSessionPool: () => getSessionPool,
  isDatabaseConfigured: () => isDatabaseConfigured,
  pool: () => pool
});
import "dotenv/config";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool as NodePgPool } from "pg";
function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || null;
}
function needsSsl(url) {
  return url.includes("neon.tech") || url.includes("sslmode=require") || url.includes("ssl=true");
}
function pgPoolOptions(url, max) {
  return {
    connectionString: url,
    max,
    idleTimeoutMillis: 1e4,
    connectionTimeoutMillis: 15e3,
    ...needsSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}
  };
}
function getSessionPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (sessionPoolInstance) return sessionPoolInstance;
  sessionPoolInstance = new NodePgPool(pgPoolOptions(url, process.env.VERCEL ? 1 : 5));
  return sessionPoolInstance;
}
function isDatabaseConfigured() {
  return Boolean(databaseUrl());
}
function getPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (poolInstance) return poolInstance;
  poolInstance = new NodePgPool(pgPoolOptions(url, process.env.VERCEL ? 2 : 10));
  return poolInstance;
}
function getDb() {
  if (!databaseUrl()) return null;
  if (dbInstance) return dbInstance;
  const pool2 = getPool();
  if (!pool2) return null;
  dbInstance = drizzleNodePg(pool2, { schema: schema_exports });
  return dbInstance;
}
var poolInstance, sessionPoolInstance, dbInstance, db, pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    poolInstance = null;
    sessionPoolInstance = null;
    dbInstance = null;
    db = new Proxy({}, {
      get(_target, prop) {
        const real = getDb();
        if (!real) {
          throw new Error("DATABASE_URL must be set.");
        }
        return Reflect.get(real, prop);
      }
    });
    pool = new Proxy({}, {
      get(_target, prop) {
        const real = getPool();
        if (!real) {
          throw new Error("DATABASE_URL must be set.");
        }
        return Reflect.get(real, prop);
      }
    });
  }
});

// server/admin.ts
var admin_exports = {};
__export(admin_exports, {
  DEFAULT_ADMIN_EMAILS: () => DEFAULT_ADMIN_EMAILS,
  getAdminEmails: () => getAdminEmails,
  resolveIsAdmin: () => resolveIsAdmin
});
function getAdminEmails() {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return /* @__PURE__ */ new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]);
}
function resolveIsAdmin(email) {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}
var DEFAULT_ADMIN_EMAILS;
var init_admin = __esm({
  "server/admin.ts"() {
    "use strict";
    DEFAULT_ADMIN_EMAILS = ["iristonweb@gmail.com"];
  }
});

// shared/username.ts
function normalizeUsername(raw) {
  return raw.trim().toLowerCase().replace(/^@/, "");
}
function validateUsername(raw) {
  const value = normalizeUsername(raw);
  if (value.length < USERNAME_MIN) {
    return { ok: false, message: `\u041D\u0438\u043A \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u043A\u043E\u0440\u043E\u0447\u0435 ${USERNAME_MIN} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432` };
  }
  if (value.length > USERNAME_MAX) {
    return { ok: false, message: `\u041D\u0438\u043A \u043D\u0435 \u0434\u043B\u0438\u043D\u043D\u0435\u0435 ${USERNAME_MAX} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432` };
  }
  if (!USERNAME_REGEX.test(value)) {
    return { ok: false, message: "\u0422\u043E\u043B\u044C\u043A\u043E \u043B\u0430\u0442\u0438\u043D\u0438\u0446\u0430 (a\u2013z), \u0446\u0438\u0444\u0440\u044B \u0438 _" };
  }
  return { ok: true, value };
}
function usernameBaseFromEmail(email) {
  const local = email.split("@")[0]?.toLowerCase() ?? "user";
  let base = local.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (base.length < USERNAME_MIN) base = `user_${base}`.replace(/_+/g, "_");
  return base.slice(0, USERNAME_MAX);
}
var USERNAME_MIN, USERNAME_MAX, USERNAME_REGEX;
var init_username = __esm({
  "shared/username.ts"() {
    "use strict";
    USERNAME_MIN = 3;
    USERNAME_MAX = 30;
    USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
  }
});

// server/user-utils.ts
var user_utils_exports = {};
__export(user_utils_exports, {
  generateUniqueUsername: () => generateUniqueUsername,
  toPublicUser: () => toPublicUser,
  toSelfUser: () => toSelfUser
});
function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username ?? null,
    displayName: user.displayName ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null
  };
}
function toSelfUser(user) {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}
async function generateUniqueUsername(storage2, email) {
  const base = usernameBaseFromEmail(email).slice(0, USERNAME_MAX - 4) || "user";
  let candidate = base.slice(0, USERNAME_MAX);
  let n = 0;
  while (await storage2.getUserByUsername(candidate)) {
    n += 1;
    const suffix = String(n);
    candidate = `${base.slice(0, USERNAME_MAX - suffix.length)}${suffix}`;
  }
  return candidate;
}
var init_user_utils = __esm({
  "server/user-utils.ts"() {
    "use strict";
    init_username();
  }
});

// server/geo/nominatim.ts
function nowMs() {
  return Date.now();
}
function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: nowMs() + ttlMs });
}
function allowGeoRequest(key, ratePerSec = 2, burst = 5) {
  const t = nowMs();
  const b = buckets.get(key) ?? { tokens: burst, lastRefillMs: t };
  const elapsedSec = Math.max(0, (t - b.lastRefillMs) / 1e3);
  const refill = elapsedSec * ratePerSec;
  b.tokens = Math.min(burst, b.tokens + refill);
  b.lastRefillMs = t;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}
function pickCity(a) {
  if (!a) return null;
  return a.city ?? a.town ?? a.village ?? a.municipality ?? a.state ?? null;
}
function toNumberOrNull(v) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
async function nominatimAutocomplete(params) {
  const q = params.q.trim();
  const limit = Math.max(1, Math.min(10, Math.floor(params.limit)));
  const lang = (params.acceptLanguage ?? "").trim();
  const cacheKey = `nominatim:v1:q=${q.toLowerCase()}:limit=${limit}:lang=${lang.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const url = new URL(BASE_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("dedupe", "1");
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      ...lang ? { "Accept-Language": lang } : {}
    }
  });
  if (!res.ok) {
    throw new Error(`Nominatim error: ${res.status}`);
  }
  const json = await res.json();
  const items = (Array.isArray(json) ? json : []).map((it) => ({
    label: it.display_name ?? "",
    city: pickCity(it.address),
    country: it.address?.country ?? null,
    lat: toNumberOrNull(it.lat),
    lon: toNumberOrNull(it.lon),
    osmId: typeof it.osm_id === "number" ? it.osm_id : null,
    osmType: it.osm_type ?? null
  })).filter((x) => x.label);
  cacheSet(cacheKey, items, 6 * 60 * 60 * 1e3);
  return items;
}
var BASE_URL, USER_AGENT, cache, buckets;
var init_nominatim = __esm({
  "server/geo/nominatim.ts"() {
    "use strict";
    BASE_URL = "https://nominatim.openstreetmap.org/search";
    USER_AGENT = "All-in-travel/1.0 (geocoding autocomplete)";
    cache = /* @__PURE__ */ new Map();
    buckets = /* @__PURE__ */ new Map();
  }
});

// server/geo/yandex-config.ts
var yandex_config_exports = {};
__export(yandex_config_exports, {
  getYandexGeocoderKey: () => getYandexGeocoderKey,
  getYandexGeosuggestKey: () => getYandexGeosuggestKey,
  getYandexRouterKey: () => getYandexRouterKey,
  isAnyYandexGeoConfigured: () => isAnyYandexGeoConfigured,
  isYandexGeocoderConfigured: () => isYandexGeocoderConfigured,
  isYandexGeosuggestConfigured: () => isYandexGeosuggestConfigured,
  isYandexRouterConfigured: () => isYandexRouterConfigured
});
function getYandexGeosuggestKey() {
  return process.env.YANDEX_GEOSUGGEST_API_KEY?.trim() || LEGACY() || void 0;
}
function getYandexGeocoderKey() {
  return process.env.YANDEX_GEOCODER_API_KEY?.trim() || LEGACY() || void 0;
}
function getYandexRouterKey() {
  return process.env.YANDEX_ROUTER_API_KEY?.trim() || void 0;
}
function isYandexGeosuggestConfigured() {
  return !!getYandexGeosuggestKey();
}
function isYandexGeocoderConfigured() {
  return !!getYandexGeocoderKey();
}
function isYandexRouterConfigured() {
  return !!getYandexRouterKey();
}
function isAnyYandexGeoConfigured() {
  return isYandexGeosuggestConfigured() || isYandexGeocoderConfigured();
}
var LEGACY;
var init_yandex_config = __esm({
  "server/geo/yandex-config.ts"() {
    "use strict";
    LEGACY = () => process.env.YANDEX_GEOCODER_API_KEY?.trim();
  }
});

// server/geo/yandex.ts
var yandex_exports = {};
__export(yandex_exports, {
  isAnyYandexGeoConfigured: () => isAnyYandexGeoConfigured,
  isYandexGeocoderConfigured: () => isYandexGeocoderConfigured,
  isYandexGeosuggestConfigured: () => isYandexGeosuggestConfigured,
  yandexAutocomplete: () => yandexAutocomplete,
  yandexForwardGeocode: () => yandexForwardGeocode
});
function cacheGet2(key) {
  const entry = cache2.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache2.delete(key);
    return null;
  }
  return entry.data;
}
function cacheSet2(key, data, ttlMs = 1e3 * 60 * 10) {
  cache2.set(key, { expiresAt: Date.now() + ttlMs, data });
}
function parsePos(pos) {
  if (!pos) return null;
  const [lonStr, latStr] = pos.trim().split(/\s+/);
  const lat = Number(latStr);
  const lon = Number(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}
function memberToItem(member) {
  const obj = member?.GeoObject;
  if (!obj) return null;
  const meta = obj.metaDataProperty?.GeocoderMetaData;
  const label = meta?.text || [obj.name, obj.description].filter(Boolean).join(", ");
  if (!label) return null;
  const coords = parsePos(obj.Point?.pos);
  const components = meta?.Address?.Components ?? [];
  const city = components.find((c) => c.kind === "locality")?.name ?? components.find((c) => c.kind === "area")?.name ?? null;
  const country = components.find((c) => c.kind === "country")?.name ?? null;
  return {
    label,
    kind: "city",
    city,
    country,
    lat: coords?.lat ?? null,
    lon: coords?.lon ?? null
  };
}
async function yandexGeocodeSuggest(params) {
  const apikey = getYandexGeocoderKey();
  if (!apikey) return [];
  const { q, limit } = params;
  const lang = params.lang ?? "ru_RU";
  const cacheKey = `yandex:geocode:${lang}:${q.toLowerCase()}:${limit}`;
  const cached = cacheGet2(cacheKey);
  if (cached) return cached;
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("geocode", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", lang);
  url.searchParams.set("results", String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text2 = await res.text();
    throw new Error(`Yandex Geocoder ${res.status}: ${text2.slice(0, 200)}`);
  }
  const data = await res.json();
  const members = data.response?.GeoObjectCollection?.featureMember ?? [];
  const items = members.map(memberToItem).filter((x) => !!x);
  cacheSet2(cacheKey, items);
  return items;
}
async function yandexSuggest(params) {
  const apikey = getYandexGeosuggestKey();
  if (!apikey) return [];
  const { q, limit } = params;
  const lang = params.lang ?? "ru_RU";
  const cacheKey = `yandex:suggest:${lang}:${q.toLowerCase()}:${limit}`;
  const cached = cacheGet2(cacheKey);
  if (cached) return cached;
  const url = new URL(SUGGEST_URL);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("text", q);
  url.searchParams.set("results", String(limit));
  url.searchParams.set("lang", lang);
  url.searchParams.set("types", "geo");
  const res = await fetch(url.toString());
  if (!res.ok) {
    return yandexGeocodeSuggest(params);
  }
  const data = await res.json();
  const items = [];
  for (const r of data.results ?? []) {
    const title = r.title?.text?.trim();
    if (!title) continue;
    const subtitle = r.subtitle?.text?.trim();
    items.push({
      label: subtitle ? `${title}, ${subtitle}` : title,
      kind: "city",
      city: title,
      country: subtitle ?? null
    });
  }
  if (items.length === 0) {
    return yandexGeocodeSuggest(params);
  }
  if (isYandexGeocoderConfigured()) {
    const enrich = items.slice(0, Math.min(5, items.length));
    await Promise.all(
      enrich.map(async (item) => {
        if (item.lat != null && item.lon != null) return;
        const geo = await yandexGeocodeSuggest({ q: item.label, limit: 1, lang });
        const first = geo[0];
        if (first?.lat != null && first.lon != null) {
          item.lat = first.lat;
          item.lon = first.lon;
        }
      })
    );
  }
  cacheSet2(cacheKey, items);
  return items;
}
async function yandexAutocomplete(params) {
  if (!isAnyYandexGeoConfigured()) return [];
  const lang = params.acceptLanguage?.toLowerCase().startsWith("en") ? "en_US" : "ru_RU";
  if (isYandexGeosuggestConfigured()) {
    try {
      const items = await yandexSuggest({ q: params.q, limit: params.limit, lang });
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Yandex geosuggest failed, trying geocoder:", e);
    }
  }
  if (isYandexGeocoderConfigured()) {
    return yandexGeocodeSuggest({ q: params.q, limit: params.limit, lang });
  }
  return [];
}
async function yandexForwardGeocode(address, lang = "ru_RU") {
  const items = await yandexGeocodeSuggest({ q: address, limit: 1, lang });
  const first = items[0];
  if (!first || first.lat == null || first.lon == null) return null;
  return { lat: first.lat, lon: first.lon, label: first.label };
}
var GEOCODE_URL, SUGGEST_URL, cache2;
var init_yandex = __esm({
  "server/geo/yandex.ts"() {
    "use strict";
    init_yandex_config();
    init_yandex_config();
    GEOCODE_URL = "https://geocode-maps.yandex.ru/v1/";
    SUGGEST_URL = "https://suggest-maps.yandex.ru/v1/suggest";
    cache2 = /* @__PURE__ */ new Map();
  }
});

// server/geo/db-autocomplete.ts
import { and as and2, desc as desc2, eq as eq2, ilike as ilike2, or as or2 } from "drizzle-orm";
function clampLimit(limit) {
  return Math.max(1, Math.min(10, Math.floor(limit)));
}
async function dbGeoAutocomplete(params) {
  const db2 = getDb();
  if (!db2) return [];
  const q = params.q.trim();
  const limit = clampLimit(params.limit ?? 8);
  const scope = params.scope ?? "all";
  const pattern = `%${q}%`;
  const results = [];
  if (scope === "country" || scope === "all") {
    const rows = await db2.select({
      code: countries.code,
      name: countries.name
    }).from(countries).where(or2(ilike2(countries.name, pattern), ilike2(countries.code, q.toUpperCase()))).limit(limit);
    for (const r of rows) {
      results.push({
        kind: "country",
        label: r.name,
        countryCode: r.code
      });
    }
  }
  const remaining = scope === "all" ? Math.max(0, limit - results.length) : limit;
  if ((scope === "city" || scope === "all") && remaining > 0) {
    const cityRows = await db2.select({
      geonameId: cities.geonameId,
      name: cities.name,
      asciiName: cities.asciiName,
      countryCode: cities.countryCode,
      latitude: cities.latitude,
      longitude: cities.longitude,
      population: cities.population,
      countryName: countries.name
    }).from(cities).leftJoin(countries, eq2(cities.countryCode, countries.code)).where(
      and2(
        or2(ilike2(cities.name, pattern), ilike2(cities.asciiName, pattern)),
        // keep only valid country codes
        ilike2(cities.countryCode, "__")
      )
    ).orderBy(desc2(cities.population), cities.name).limit(remaining);
    for (const r of cityRows) {
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      const population = r.population ?? 0;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const countryName = r.countryName ?? r.countryCode;
      results.push({
        kind: "city",
        label: `${r.name}, ${countryName}`,
        geonameId: r.geonameId,
        countryCode: r.countryCode,
        lat,
        lon,
        city: r.name,
        country: countryName,
        population
      });
    }
  }
  return results.slice(0, limit);
}
var init_db_autocomplete = __esm({
  "server/geo/db-autocomplete.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/geo/resolve-autocomplete.ts
var resolve_autocomplete_exports = {};
__export(resolve_autocomplete_exports, {
  resolveGeoAutocomplete: () => resolveGeoAutocomplete
});
function clampLimit2(limit) {
  return Math.max(1, Math.min(12, Math.floor(limit)));
}
function labelKey(item) {
  return item.label.trim().toLowerCase();
}
function mergeUnique(target, incoming, max) {
  const seen = new Set(target.map(labelKey));
  for (const item of incoming) {
    if (target.length >= max) break;
    const key = labelKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    target.push(item);
  }
}
function dbItemToGeo(item) {
  if (item.kind === "country") {
    return {
      kind: "country",
      label: item.label,
      countryCode: item.countryCode,
      country: item.label
    };
  }
  return {
    kind: "city",
    label: item.label,
    geonameId: item.geonameId,
    countryCode: item.countryCode,
    lat: item.lat,
    lon: item.lon,
    city: item.city,
    country: item.country,
    population: item.population
  };
}
async function resolveGeoAutocomplete(params) {
  const q = params.q.trim();
  const limit = clampLimit2(params.limit ?? 8);
  const scope = params.scope ?? "all";
  const results = [];
  if (process.env.DATABASE_URL) {
    try {
      const dbItems = await dbGeoAutocomplete({ q, limit, scope });
      mergeUnique(results, dbItems.map(dbItemToGeo), limit);
    } catch (e) {
      console.warn("DB geo autocomplete failed; using external providers.", e);
    }
  }
  const remaining = () => Math.max(0, limit - results.length);
  if (remaining() > 0 && isAnyYandexGeoConfigured()) {
    try {
      const ya = await yandexAutocomplete({
        q,
        limit: remaining(),
        acceptLanguage: params.acceptLanguage ?? null
      });
      mergeUnique(results, ya, limit);
    } catch (e) {
      console.warn("Yandex autocomplete failed; trying Nominatim.", e);
    }
  }
  if (remaining() > 0) {
    const nom = await nominatimAutocomplete({
      q,
      limit: remaining(),
      acceptLanguage: params.acceptLanguage ?? null
    });
    mergeUnique(results, nom, limit);
  }
  return results;
}
var init_resolve_autocomplete = __esm({
  "server/geo/resolve-autocomplete.ts"() {
    "use strict";
    init_nominatim();
    init_yandex_config();
    init_yandex();
    init_db_autocomplete();
  }
});

// server/geo/yandex-router.ts
var yandex_router_exports = {};
__export(yandex_router_exports, {
  yandexBuildRoute: () => yandexBuildRoute
});
function parseGeometry(geometry) {
  if (!geometry) return [];
  if (typeof geometry === "string") {
    return decodePolyline6(geometry);
  }
  if (Array.isArray(geometry)) {
    const out = [];
    for (const pt of geometry) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const a = Number(pt[0]);
        const b = Number(pt[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (Math.abs(a) <= 90 && Math.abs(b) > 90) {
          out.push([b, a]);
        } else {
          out.push([a, b]);
        }
      }
    }
    return out;
  }
  return [];
}
function decodePolyline6(encoded) {
  const coordinates = [];
  let index2 = 0;
  let lat = 0;
  let lng = 0;
  while (index2 < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index2++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index2++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;
    coordinates.push([lng / 1e6, lat / 1e6]);
  }
  return coordinates;
}
async function yandexBuildRoute(points, mode = "driving") {
  const apikey = getYandexRouterKey();
  if (!apikey || points.length < 2) return null;
  const waypoints = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)).map((p) => `${p.lat},${p.lon}`).join("|");
  if (!waypoints) return null;
  const url = new URL(ROUTE_URL);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("waypoints", waypoints);
  url.searchParams.set("mode", mode);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text2 = await res.text();
    throw new Error(`Yandex Router ${res.status}: ${text2.slice(0, 300)}`);
  }
  const data = await res.json();
  const route = data.route ?? data.routes?.[0];
  if (!route) return null;
  const legs = route.legs ?? [];
  const distanceM = legs.reduce((s, l) => s + (l.length ?? 0), 0);
  const durationS = legs.reduce((s, l) => s + (l.duration ?? 0), 0);
  const geometry = parseGeometry(route.geometry);
  return {
    distanceM,
    durationS,
    geometry: geometry.length > 0 ? geometry : points.map((p) => [p.lon, p.lat])
  };
}
var ROUTE_URL;
var init_yandex_router = __esm({
  "server/geo/yandex-router.ts"() {
    "use strict";
    init_yandex_config();
    ROUTE_URL = "https://api.routing.yandex.net/v2/route";
  }
});

// server/vite-stub.ts
var vite_stub_exports = {};
__export(vite_stub_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
function log() {
}
async function setupVite(_app, _server) {
}
function serveStatic(_app) {
}
var init_vite_stub = __esm({
  "server/vite-stub.ts"() {
  }
});

// server/createApp.ts
import "dotenv/config";
import { createServer as createServer2 } from "http";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_db();

// server/pg-storage.ts
init_schema();
init_db();
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
  sql as sql2
} from "drizzle-orm";

// server/seed-data.ts
var DEMO_USER_ID = "00000000-0000-4000-a000-000000000001";
var SEED_PLACE_IDS = {
  santorini: "11111111-1111-4111-a111-111111111101",
  kyoto: "11111111-1111-4111-a111-111111111102",
  machuPicchu: "11111111-1111-4111-a111-111111111103",
  amalfi: "11111111-1111-4111-a111-111111111104",
  iceland: "11111111-1111-4111-a111-111111111105",
  louvre: "11111111-1111-4111-a111-111111111106"
};
function buildSeedData(now = /* @__PURE__ */ new Date()) {
  return {
    demoUser: {
      id: DEMO_USER_ID,
      email: "demo@allintravel.app",
      firstName: "Demo",
      lastName: "Traveler",
      profileImageUrl: null
    },
    places: [
      {
        id: SEED_PLACE_IDS.santorini,
        name: "Santorini Sunset Terrace",
        description: "Breathtaking views of the caldera with iconic white-washed buildings and stunning sunsets.",
        type: "attraction",
        address: "Oia, Santorini 847 02, Greece",
        latitude: "36.4618",
        longitude: "25.3753",
        imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
        priceRange: "$$",
        averageRating: "4.80",
        reviewCount: 247,
        isVerified: true
      },
      {
        id: SEED_PLACE_IDS.kyoto,
        name: "Kyoto Bamboo Grove",
        description: "Walk through towering bamboo stalks in the Arashiyama district.",
        type: "attraction",
        address: "Sagatenryuji Susukinobabachou, Ukyo Ward, Kyoto",
        latitude: "35.0094",
        longitude: "135.6727",
        imageUrl: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800",
        priceRange: "$",
        averageRating: "4.70",
        reviewCount: 183,
        isVerified: true
      },
      {
        id: SEED_PLACE_IDS.machuPicchu,
        name: "Machu Picchu",
        description: "The iconic Inca citadel set high in the Andes Mountains of Peru.",
        type: "attraction",
        address: "Machu Picchu, Cusco Region, Peru",
        latitude: "-13.1631",
        longitude: "-72.5450",
        imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
        priceRange: "$$$",
        averageRating: "4.90",
        reviewCount: 512,
        isVerified: true
      },
      {
        id: SEED_PLACE_IDS.amalfi,
        name: "Amalfi Coast",
        description: "One of Europe's most scenic drives along dramatic cliffs.",
        type: "attraction",
        address: "Amalfi Coast, Province of Salerno, Italy",
        latitude: "40.6340",
        longitude: "14.6027",
        imageUrl: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800",
        priceRange: "$$$",
        averageRating: "4.60",
        reviewCount: 318,
        isVerified: true
      },
      {
        id: SEED_PLACE_IDS.iceland,
        name: "Northern Lights, Iceland",
        description: "Witness the spectacular Aurora Borealis dancing across Iceland's night sky.",
        type: "attraction",
        address: "Thingvellir National Park, Iceland",
        latitude: "64.2559",
        longitude: "-21.1294",
        imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800",
        priceRange: "$$",
        averageRating: "4.90",
        reviewCount: 421,
        isVerified: true
      },
      {
        id: SEED_PLACE_IDS.louvre,
        name: "The Louvre Museum",
        description: "World's largest art museum housing thousands of iconic works.",
        type: "attraction",
        address: "Rue de Rivoli, 75001 Paris, France",
        latitude: "48.8606",
        longitude: "2.3376",
        imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800",
        priceRange: "$$",
        averageRating: "4.70",
        reviewCount: 892,
        isVerified: true
      }
    ],
    events: [
      {
        id: "22222222-2222-4222-a222-222222222201",
        title: "Tokyo Cherry Blossom Festival",
        description: "Join us for the annual Hanami festival in Ueno Park.",
        type: "festival",
        location: "Ueno Park, Tokyo, Japan",
        startDate: new Date(now.getTime() + 7 * 24 * 36e5),
        endDate: new Date(now.getTime() + 10 * 24 * 36e5),
        imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800",
        price: null
      },
      {
        id: "22222222-2222-4222-a222-222222222202",
        title: "Santorini Photography Workshop",
        description: "A 3-day photography retreat capturing Santorini landscapes.",
        type: "workshop",
        location: "Oia, Santorini, Greece",
        startDate: new Date(now.getTime() + 14 * 24 * 36e5),
        endDate: new Date(now.getTime() + 17 * 24 * 36e5),
        imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
        price: 29900
      },
      {
        id: "22222222-2222-4222-a222-222222222203",
        title: "Patagonia Hiking Expedition",
        description: "Epic 10-day trek through Torres del Paine National Park.",
        type: "adventure",
        location: "Torres del Paine, Patagonia, Chile",
        startDate: new Date(now.getTime() + 30 * 24 * 36e5),
        endDate: new Date(now.getTime() + 40 * 24 * 36e5),
        imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800",
        price: 149900
      }
    ],
    trips: [
      {
        id: "33333333-3333-4333-a333-333333333301",
        userId: DEMO_USER_ID,
        title: "Greek Island Hopping",
        description: "2-week adventure visiting Mykonos, Santorini, Crete, and Rhodes.",
        destination: "Greece",
        startDate: new Date(now.getTime() + 20 * 24 * 36e5),
        endDate: new Date(now.getTime() + 34 * 24 * 36e5),
        maxParticipants: 8,
        currentParticipants: 3,
        budgetMin: 2e3,
        budgetMax: 4e3,
        tags: ["islands", "Greece", "sailing", "culture"]
      },
      {
        id: "33333333-3333-4333-a333-333333333302",
        userId: DEMO_USER_ID,
        title: "Japan in Spring",
        description: "2-week cultural journey through Tokyo, Kyoto, Osaka, and Hiroshima.",
        destination: "Japan",
        startDate: new Date(now.getTime() + 45 * 24 * 36e5),
        endDate: new Date(now.getTime() + 59 * 24 * 36e5),
        maxParticipants: 6,
        currentParticipants: 2,
        budgetMin: 3e3,
        budgetMax: 6e3,
        tags: ["Japan", "culture", "food", "temples"]
      }
    ],
    posts: [
      {
        id: "44444444-4444-4444-a444-444444444401",
        userId: DEMO_USER_ID,
        title: "Bali Rice Terraces",
        content: "Just arrived in Bali and I'm absolutely speechless! The rice terraces of Tegalalang are even more beautiful in person.",
        images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800"],
        location: "Bali, Indonesia",
        latitude: "-8.3405",
        longitude: "115.0920",
        tags: ["Bali", "Indonesia", "ricefields", "travel"],
        createdAt: new Date(now.getTime() - 2 * 36e5)
      },
      {
        id: "44444444-4444-4444-a444-444444444402",
        userId: DEMO_USER_ID,
        title: "Sahara Sunrise",
        content: "Watching the sunrise over the Sahara Desert from our camel's back. Morocco has stolen my heart forever.",
        images: ["https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800"],
        location: "Sahara Desert, Morocco",
        latitude: "31.7917",
        longitude: "-7.0926",
        tags: ["Morocco", "Sahara", "camel", "desert", "sunrise"],
        createdAt: new Date(now.getTime() - 24 * 36e5)
      },
      {
        id: "44444444-4444-4444-a444-444444444403",
        userId: DEMO_USER_ID,
        title: "Bangkok Street Food Tour",
        content: "Street food tour in Bangkok complete! Pad Thai, mango sticky rice, green curry and so much more.",
        images: ["https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800"],
        location: "Bangkok, Thailand",
        latitude: "13.7563",
        longitude: "100.5018",
        tags: ["Bangkok", "Thailand", "food", "streetfood"],
        createdAt: new Date(now.getTime() - 48 * 36e5)
      }
    ]
  };
}

// server/pg-storage.ts
init_admin();
var PgStorage = class {
  db;
  constructor(db2) {
    const instance = db2 ?? getDb();
    if (!instance) throw new Error("DATABASE_URL is required for PgStorage");
    this.db = instance;
  }
  async ensureSchema() {
    await this.db.execute(
      sql2`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar`
    );
    await this.db.execute(
      sql2`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false`
    );
  }
  async ensureSeeded() {
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
        amenities: null
      }))
    );
    await this.db.insert(events).values(
      seed.events.map((e) => ({
        ...e,
        organizerId: null,
        isActive: true
      }))
    );
    await this.db.insert(trips).values(
      seed.trips.map((t) => ({ ...t, isActive: true }))
    );
    await this.db.insert(travelPosts).values(
      seed.posts.map((p) => ({
        ...p,
        isPublic: true,
        updatedAt: p.createdAt
      }))
    );
    console.log("[PgStorage] Demo seed data inserted.");
  }
  async getUser(id) {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }
  async getUserByEmail(email) {
    const lower = email.trim().toLowerCase();
    const [row] = await this.db.select().from(users).where(sql2`lower(${users.email}) = ${lower}`).limit(1);
    return row;
  }
  async getUserByUsername(username) {
    const lower = username.trim().toLowerCase().replace(/^@/, "");
    const [row] = await this.db.select().from(users).where(sql2`lower(${users.username}) = ${lower}`).limit(1);
    return row;
  }
  async updateUserMe(userId, data) {
    const [updated] = await this.db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }
  async ensureUsernames() {
    const { generateUniqueUsername: generateUniqueUsername2 } = await Promise.resolve().then(() => (init_user_utils(), user_utils_exports));
    const rows = await this.db.select().from(users).where(isNull(users.username));
    for (const row of rows) {
      if (!row.email) continue;
      const username = await generateUniqueUsername2(this, row.email);
      await this.db.update(users).set({ username, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, row.id));
    }
  }
  async upsertUser(userData) {
    const id = userData.id;
    const adminFlag = resolveIsAdmin(userData.email ?? void 0);
    const payload = {
      ...userData,
      isAdmin: adminFlag || userData.isAdmin === true,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const existing = await this.getUser(id);
    if (existing) {
      const [updated] = await this.db.update(users).set(payload).where(eq(users.id, id)).returning();
      return updated;
    }
    const [created] = await this.db.insert(users).values({ ...payload, createdAt: /* @__PURE__ */ new Date() }).returning();
    return created;
  }
  async setUserAdmin(userId, isAdmin) {
    const [updated] = await this.db.update(users).set({ isAdmin, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }
  async ensureAdminUsers() {
    const { getAdminEmails: getAdminEmails2 } = await Promise.resolve().then(() => (init_admin(), admin_exports));
    for (const email of getAdminEmails2()) {
      const user = await this.getUserByEmail(email);
      if (user && !user.isAdmin) {
        await this.setUserAdmin(user.id, true);
        console.log(`[admin] Granted admin to ${email}`);
      }
    }
  }
  async setUserPassword(userId, passwordHash) {
    const [updated] = await this.db.update(users).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }
  async getPlaces(filters) {
    const conditions = [];
    if (filters?.type) conditions.push(eq(places.type, filters.type));
    if (filters?.search) {
      const term = filters.search.trim();
      const q = `%${term}%`;
      const placeMatch = or(
        ilike(places.name, q),
        ilike(places.address, q),
        ilike(places.description, q)
      );
      const cityRows = await this.db.select({ name: cities.name }).from(cities).where(or(ilike(cities.name, q), ilike(cities.asciiName, q))).orderBy(desc(cities.population)).limit(5);
      if (cityRows.length > 0) {
        const cityAddressMatch = or(
          ...cityRows.map((c) => ilike(places.address, `%${c.name}%`))
        );
        conditions.push(or(placeMatch, cityAddressMatch));
      } else {
        conditions.push(placeMatch);
      }
    }
    if (filters?.minRating != null) {
      conditions.push(gte(places.averageRating, String(filters.minRating)));
    }
    if (filters?.priceRange) conditions.push(eq(places.priceRange, filters.priceRange));
    let query = this.db.select().from(places);
    if (conditions.length) query = query.where(and(...conditions));
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }
  async getPlace(id) {
    const [row] = await this.db.select().from(places).where(eq(places.id, id)).limit(1);
    return row;
  }
  async createPlace(place) {
    const [row] = await this.db.insert(places).values({ ...place, reviewCount: 0, averageRating: "0" }).returning();
    return row;
  }
  async updatePlace(id, place) {
    const [row] = await this.db.update(places).set({ ...place, updatedAt: /* @__PURE__ */ new Date() }).where(eq(places.id, id)).returning();
    if (!row) throw new Error("Place not found");
    return row;
  }
  async getReviewsByPlace(placeId) {
    return this.db.select().from(reviews).where(eq(reviews.placeId, placeId));
  }
  async getReviewsByUser(userId) {
    return this.db.select().from(reviews).where(eq(reviews.userId, userId));
  }
  async createReview(review) {
    const [row] = await this.db.insert(reviews).values(review).returning();
    await this.updatePlaceRating(review.placeId);
    return row;
  }
  async updatePlaceRating(placeId) {
    const placeReviews = await this.getReviewsByPlace(placeId);
    if (!placeReviews.length) return;
    const avg = placeReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / placeReviews.length;
    await this.db.update(places).set({ averageRating: avg.toFixed(1), reviewCount: placeReviews.length, updatedAt: /* @__PURE__ */ new Date() }).where(eq(places.id, placeId));
  }
  async getTrips(filters) {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(trips.userId, filters.userId));
    if (filters?.destination) conditions.push(ilike(trips.destination, `%${filters.destination}%`));
    if (filters?.startDate) conditions.push(gte(trips.startDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(trips.endDate, filters.endDate));
    let query = this.db.select().from(trips).orderBy(desc(trips.startDate));
    if (conditions.length) query = query.where(and(...conditions));
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }
  async getTrip(id) {
    const [row] = await this.db.select().from(trips).where(eq(trips.id, id)).limit(1);
    return row;
  }
  async createTrip(trip) {
    const [row] = await this.db.insert(trips).values({ ...trip, currentParticipants: 1 }).returning();
    return row;
  }
  async joinTrip(tripId, userId) {
    const [participant] = await this.db.insert(tripParticipants).values({ tripId, userId, status: "confirmed" }).returning();
    await this.db.update(trips).set({ currentParticipants: sql2`${trips.currentParticipants} + 1`, updatedAt: /* @__PURE__ */ new Date() }).where(eq(trips.id, tripId));
    return participant;
  }
  async getTripParticipants(tripId) {
    return this.db.select().from(tripParticipants).where(eq(tripParticipants.tripId, tripId));
  }
  async getTripParticipationsByUser(userId) {
    const rows = await this.db.select({ tripId: tripParticipants.tripId }).from(tripParticipants).where(eq(tripParticipants.userId, userId));
    return rows.map((r) => r.tripId);
  }
  async getTripWaypoints(tripId) {
    const waypoints = await this.db.select().from(tripWaypoints).where(eq(tripWaypoints.tripId, tripId)).orderBy(asc(tripWaypoints.orderIndex));
    return Promise.all(
      waypoints.map(async (w) => ({
        ...w,
        place: await this.getPlace(w.placeId) ?? null
      }))
    );
  }
  async addTripWaypoint(tripId, placeId, orderIndex, dayNumber) {
    const existing = await this.db.select().from(tripWaypoints).where(eq(tripWaypoints.tripId, tripId));
    const nextOrder = orderIndex ?? existing.length;
    const [row] = await this.db.insert(tripWaypoints).values({ tripId, placeId, orderIndex: nextOrder, dayNumber: dayNumber ?? null }).returning();
    return row;
  }
  async updateTripWaypoint(waypointId, data) {
    const patch = {};
    if (data.orderIndex != null) patch.orderIndex = data.orderIndex;
    if (data.dayNumber != null) patch.dayNumber = data.dayNumber;
    const [row] = await this.db.update(tripWaypoints).set(patch).where(eq(tripWaypoints.id, waypointId)).returning();
    return row;
  }
  async removeTripWaypoint(waypointId) {
    await this.db.delete(tripWaypoints).where(eq(tripWaypoints.id, waypointId));
  }
  async getEvents(filters) {
    const conditions = [];
    if (filters?.type) conditions.push(eq(events.type, filters.type));
    if (filters?.upcoming) conditions.push(gte(events.startDate, /* @__PURE__ */ new Date()));
    let query = this.db.select().from(events).orderBy(asc(events.startDate));
    if (conditions.length) query = query.where(and(...conditions));
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }
  async getEvent(id) {
    const [row] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    return row;
  }
  async createEvent(event) {
    const [row] = await this.db.insert(events).values(event).returning();
    return row;
  }
  async registerForEvent(eventId, userId) {
    const existing = await this.isRegisteredForEvent(eventId, userId);
    if (existing) {
      const [row2] = await this.db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId))).limit(1);
      return row2;
    }
    const [row] = await this.db.insert(eventRegistrations).values({ eventId, userId }).returning();
    return row;
  }
  async unregisterFromEvent(eventId, userId) {
    await this.db.delete(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)));
  }
  async getRegisteredEventIds(userId) {
    const rows = await this.db.select({ eventId: eventRegistrations.eventId }).from(eventRegistrations).where(eq(eventRegistrations.userId, userId));
    return rows.map((r) => r.eventId);
  }
  async isRegisteredForEvent(eventId, userId) {
    const [row] = await this.db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId))).limit(1);
    return Boolean(row);
  }
  async getChatMessages(chatRoom, limit = 50) {
    const rows = await this.db.select().from(chatMessages).where(eq(chatMessages.chatRoom, chatRoom)).orderBy(asc(chatMessages.createdAt));
    return rows.slice(-limit);
  }
  async createChatMessage(message) {
    const [row] = await this.db.insert(chatMessages).values(message).returning();
    return row;
  }
  async getUserFavorites(userId) {
    return this.db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
  }
  async addFavorite(userId, placeId) {
    const [row] = await this.db.insert(userFavorites).values({ userId, placeId }).returning();
    return row;
  }
  async removeFavorite(userId, placeId) {
    await this.db.delete(userFavorites).where(and(eq(userFavorites.userId, userId), eq(userFavorites.placeId, placeId)));
  }
  async isFavorite(userId, placeId) {
    const [row] = await this.db.select().from(userFavorites).where(and(eq(userFavorites.userId, userId), eq(userFavorites.placeId, placeId))).limit(1);
    return Boolean(row);
  }
  async getUserProfile(userId) {
    const [row] = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return row;
  }
  async createUserProfile(profile) {
    const [row] = await this.db.insert(userProfiles).values(profile).returning();
    return row;
  }
  async updateUserProfile(userId, profile) {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      return this.createUserProfile({ userId, ...profile });
    }
    const [row] = await this.db.update(userProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userProfiles.userId, userId)).returning();
    return row;
  }
  async sendFriendRequest(requesterId, addresseeId) {
    const [row] = await this.db.insert(friendships).values({ requesterId, addresseeId, status: "pending" }).returning();
    return row;
  }
  async respondToFriendRequest(friendshipId, status) {
    const [row] = await this.db.update(friendships).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(friendships.id, friendshipId)).returning();
    if (!row) throw new Error("Friendship not found");
    return row;
  }
  async getFriends(userId) {
    const accepted = await this.db.select().from(friendships).where(and(eq(friendships.status, "accepted"), or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))));
    const friendIds = accepted.map((f) => f.requesterId === userId ? f.addresseeId : f.requesterId);
    if (!friendIds.length) return [];
    return this.db.select().from(users).where(inArray(users.id, friendIds));
  }
  async getFriendRequests(userId, type) {
    if (type === "sent") {
      return this.db.select().from(friendships).where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending")));
    }
    return this.db.select().from(friendships).where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
  }
  async removeFriend(userId, friendId) {
    await this.db.delete(friendships).where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
        and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId))
      )
    );
  }
  async followUser(followerId, followingId) {
    const [row] = await this.db.insert(userFollows).values({ followerId, followingId }).returning();
    return row;
  }
  async unfollowUser(followerId, followingId) {
    await this.db.delete(userFollows).where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
  }
  async getFollowers(userId) {
    const rows = await this.db.select().from(userFollows).where(eq(userFollows.followingId, userId));
    if (!rows.length) return [];
    return this.db.select().from(users).where(inArray(users.id, rows.map((r) => r.followerId)));
  }
  async getFollowing(userId) {
    const rows = await this.db.select().from(userFollows).where(eq(userFollows.followerId, userId));
    if (!rows.length) return [];
    return this.db.select().from(users).where(inArray(users.id, rows.map((r) => r.followingId)));
  }
  async isFollowing(followerId, followingId) {
    const [row] = await this.db.select().from(userFollows).where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId))).limit(1);
    return Boolean(row);
  }
  async sendPrivateMessage(message) {
    const [row] = await this.db.insert(privateMessages).values(message).returning();
    return row;
  }
  async getPrivateMessages(userId1, userId2, limit = 50) {
    const rows = await this.db.select().from(privateMessages).where(
      or(
        and(eq(privateMessages.senderId, userId1), eq(privateMessages.receiverId, userId2)),
        and(eq(privateMessages.senderId, userId2), eq(privateMessages.receiverId, userId1))
      )
    ).orderBy(asc(privateMessages.createdAt));
    return rows.slice(-limit);
  }
  async getConversations(userId) {
    const msgs = await this.db.select().from(privateMessages).where(or(eq(privateMessages.senderId, userId), eq(privateMessages.receiverId, userId))).orderBy(desc(privateMessages.createdAt));
    const partnerMap = /* @__PURE__ */ new Map();
    for (const m of msgs) {
      const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!partnerMap.has(partnerId)) partnerMap.set(partnerId, []);
      partnerMap.get(partnerId).push(m);
    }
    const conversations = [];
    for (const [partnerId, thread] of Array.from(partnerMap.entries())) {
      const partner = await this.getUser(partnerId);
      if (!partner) continue;
      thread.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const lastMessage = thread[thread.length - 1];
      const unreadCount = thread.filter(
        (m) => m.receiverId === userId && !m.isRead
      ).length;
      conversations.push({ user: partner, lastMessage, unreadCount });
    }
    return conversations.sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }
  async markMessagesAsRead(userId, senderId) {
    await this.db.update(privateMessages).set({ isRead: true }).where(
      and(
        eq(privateMessages.receiverId, userId),
        eq(privateMessages.senderId, senderId),
        eq(privateMessages.isRead, false)
      )
    );
  }
  async createTravelPost(post) {
    const [row] = await this.db.insert(travelPosts).values(post).returning();
    return row;
  }
  async getTravelPosts(filters) {
    const conditions = [];
    if (filters?.publicOnly) conditions.push(eq(travelPosts.isPublic, true));
    if (filters?.userId) conditions.push(eq(travelPosts.userId, filters.userId));
    if (filters?.following) {
      const followingRows = await this.db.select({ id: userFollows.followingId }).from(userFollows).where(eq(userFollows.followerId, filters.following));
      const ids = followingRows.map((r) => r.id);
      if (!ids.length) return [];
      conditions.push(inArray(travelPosts.userId, ids));
    }
    if (filters?.tag) {
      conditions.push(
        sql2`EXISTS (SELECT 1 FROM unnest(${travelPosts.tags}) AS t(tag) WHERE lower(t.tag) = ${filters.tag.toLowerCase()})`
      );
    }
    let query = this.db.select().from(travelPosts).orderBy(desc(travelPosts.createdAt));
    if (conditions.length) query = query.where(and(...conditions));
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return query.limit(limit).offset(offset);
  }
  async getTravelPost(id) {
    const [row] = await this.db.select().from(travelPosts).where(eq(travelPosts.id, id)).limit(1);
    return row;
  }
  async updateTravelPost(id, post) {
    const [row] = await this.db.update(travelPosts).set({ ...post, updatedAt: /* @__PURE__ */ new Date() }).where(eq(travelPosts.id, id)).returning();
    if (!row) throw new Error("Post not found");
    return row;
  }
  async deleteTravelPost(id) {
    await this.db.delete(travelPosts).where(eq(travelPosts.id, id));
  }
  async likePost(userId, postId) {
    const [row] = await this.db.insert(postLikes).values({ userId, postId }).returning();
    return row;
  }
  async unlikePost(userId, postId) {
    await this.db.delete(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
  }
  async addPostComment(comment) {
    const [row] = await this.db.insert(postComments).values(comment).returning();
    return row;
  }
  async getPostComments(postId) {
    return this.db.select().from(postComments).where(eq(postComments.postId, postId)).orderBy(asc(postComments.createdAt));
  }
  async getPostComment(id) {
    const [row] = await this.db.select().from(postComments).where(eq(postComments.id, id)).limit(1);
    return row;
  }
  async deletePostComment(id) {
    await this.db.delete(postComments).where(eq(postComments.id, id));
  }
  async searchUsers(query, limit = 10) {
    const term = query.trim().replace(/^@/, "");
    const q = `%${term}%`;
    return this.db.select().from(users).where(
      or(
        ilike(users.username, q),
        ilike(users.displayName, q),
        ilike(users.firstName, q),
        ilike(users.lastName, q),
        ilike(users.email, q)
      )
    ).limit(limit);
  }
  async getPostLikesCount(postId) {
    const [{ value }] = await this.db.select({ value: count() }).from(postLikes).where(eq(postLikes.postId, postId));
    return Number(value);
  }
  async isPostLikedByUser(userId, postId) {
    const [row] = await this.db.select().from(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))).limit(1);
    return Boolean(row);
  }
  async getPostCommentsCount(postId) {
    const [{ value }] = await this.db.select({ value: count() }).from(postComments).where(eq(postComments.postId, postId));
    return Number(value);
  }
  async getUserTrips(userId) {
    return this.getTrips({ userId });
  }
};

// server/storage.ts
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
var MemStorage = class {
  users = /* @__PURE__ */ new Map();
  places = /* @__PURE__ */ new Map();
  reviews = /* @__PURE__ */ new Map();
  trips = /* @__PURE__ */ new Map();
  tripParticipants = /* @__PURE__ */ new Map();
  tripWaypoints = /* @__PURE__ */ new Map();
  events = /* @__PURE__ */ new Map();
  eventRegistrations = /* @__PURE__ */ new Map();
  chatMessages = /* @__PURE__ */ new Map();
  userFavorites = /* @__PURE__ */ new Map();
  userProfiles = /* @__PURE__ */ new Map();
  friendships = /* @__PURE__ */ new Map();
  userFollows = /* @__PURE__ */ new Map();
  privateMessages = /* @__PURE__ */ new Map();
  travelPosts = /* @__PURE__ */ new Map();
  postLikes = /* @__PURE__ */ new Map();
  postComments = /* @__PURE__ */ new Map();
  constructor() {
    this.seedData();
  }
  seedData() {
    const samplePlaces = [
      {
        id: "place1",
        name: "Santorini Sunset Terrace",
        description: "Breathtaking views of the caldera with iconic white-washed buildings and stunning sunsets.",
        type: "attraction",
        address: "Oia, Santorini 847 02, Greece",
        latitude: "36.4618",
        longitude: "25.3753",
        imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
        priceRange: "$$",
        averageRating: "4.80",
        reviewCount: 247,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
        isVerified: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "place2",
        name: "Kyoto Bamboo Grove",
        description: "Walk through towering bamboo stalks in the Arashiyama district. A serene and magical experience.",
        type: "nature",
        address: "Sagatenryuji Susukinobabachou, Ukyo Ward, Kyoto",
        latitude: "35.0094",
        longitude: "135.6727",
        imageUrl: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800",
        priceRange: "$",
        averageRating: "4.70",
        reviewCount: 183,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
        isVerified: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "place3",
        name: "Machu Picchu",
        description: "The iconic Inca citadel set high in the Andes Mountains of Peru. A UNESCO World Heritage Site.",
        type: "historical",
        address: "Machu Picchu, Cusco Region, Peru",
        latitude: "-13.1631",
        longitude: "-72.5450",
        imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
        priceRange: "$$$",
        averageRating: "4.90",
        reviewCount: 512,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
        isVerified: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "place4",
        name: "Amalfi Coast",
        description: "One of Europe's most scenic drives winding along dramatic cliffs above the azure Mediterranean Sea.",
        type: "attraction",
        address: "Amalfi Coast, Province of Salerno, Italy",
        latitude: "40.6340",
        longitude: "14.6027",
        imageUrl: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800",
        priceRange: "$$$",
        averageRating: "4.60",
        reviewCount: 318,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
        isVerified: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "place5",
        name: "Northern Lights, Iceland",
        description: "Witness the spectacular Aurora Borealis dancing across Iceland's night sky.",
        type: "nature",
        address: "Thingvellir National Park, Iceland",
        latitude: "64.2559",
        longitude: "-21.1294",
        imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800",
        priceRange: "$$",
        averageRating: "4.90",
        reviewCount: 421,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
        isVerified: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "place6",
        name: "The Louvre Museum",
        description: "World's largest art museum and historic monument housing thousands of iconic works including the Mona Lisa.",
        type: "museum",
        address: "Rue de Rivoli, 75001 Paris, France",
        latitude: "48.8606",
        longitude: "2.3376",
        imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800",
        priceRange: "$$",
        averageRating: "4.70",
        reviewCount: 892,
        phone: null,
        website: null,
        cuisine: null,
        amenities: null,
        isVerified: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    samplePlaces.forEach((p) => this.places.set(p.id, p));
    const now = /* @__PURE__ */ new Date();
    const sampleEvents = [
      {
        id: "event1",
        title: "Tokyo Cherry Blossom Festival",
        description: "Join us for the annual Hanami festival in Ueno Park. Experience the beauty of sakura season with live music, food stalls, and traditional performances.",
        type: "festival",
        location: "Ueno Park, Tokyo, Japan",
        startDate: new Date(now.getTime() + 7 * 24 * 36e5),
        endDate: new Date(now.getTime() + 10 * 24 * 36e5),
        imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800",
        organizerId: null,
        price: null,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "event2",
        title: "Santorini Photography Workshop",
        description: "A 3-day photography retreat capturing the iconic landscapes of Santorini. Perfect for all skill levels.",
        type: "workshop",
        location: "Oia, Santorini, Greece",
        startDate: new Date(now.getTime() + 14 * 24 * 36e5),
        endDate: new Date(now.getTime() + 17 * 24 * 36e5),
        imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
        organizerId: null,
        price: 29900,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "event3",
        title: "Patagonia Hiking Expedition",
        description: "Epic 10-day trek through Torres del Paine National Park. All experience levels welcome.",
        type: "adventure",
        location: "Torres del Paine, Patagonia, Chile",
        startDate: new Date(now.getTime() + 30 * 24 * 36e5),
        endDate: new Date(now.getTime() + 40 * 24 * 36e5),
        imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800",
        organizerId: null,
        price: 149900,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    sampleEvents.forEach((e) => this.events.set(e.id, e));
    const sampleTrips = [
      {
        id: "trip1",
        userId: "demo-user",
        title: "Greek Island Hopping",
        description: "2-week adventure visiting Mykonos, Santorini, Crete, and Rhodes.",
        destination: "Greece",
        startDate: new Date(now.getTime() + 20 * 24 * 36e5),
        endDate: new Date(now.getTime() + 34 * 24 * 36e5),
        maxParticipants: 8,
        currentParticipants: 3,
        budgetMin: 2e3,
        budgetMax: 4e3,
        tags: ["islands", "Greece", "sailing", "culture"],
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "trip2",
        userId: "demo-user",
        title: "Japan in Spring",
        description: "2-week cultural journey through Tokyo, Kyoto, Osaka, and Hiroshima during cherry blossom season.",
        destination: "Japan",
        startDate: new Date(now.getTime() + 45 * 24 * 36e5),
        endDate: new Date(now.getTime() + 59 * 24 * 36e5),
        maxParticipants: 6,
        currentParticipants: 2,
        budgetMin: 3e3,
        budgetMax: 6e3,
        tags: ["Japan", "culture", "food", "temples"],
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    sampleTrips.forEach((t) => this.trips.set(t.id, t));
    const samplePosts = [
      {
        id: "post1",
        userId: "demo-user",
        title: "Bali Rice Terraces",
        content: "Just arrived in Bali and I'm absolutely speechless! The rice terraces of Tegalalang are even more beautiful in person. If you haven't put Bali on your travel list, you're missing out!",
        images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800"],
        location: "Bali, Indonesia",
        latitude: "-8.3405",
        longitude: "115.0920",
        tags: ["Bali", "Indonesia", "ricefields", "travel"],
        isPublic: true,
        createdAt: new Date(now.getTime() - 2 * 36e5),
        updatedAt: new Date(now.getTime() - 2 * 36e5)
      },
      {
        id: "post2",
        userId: "demo-user",
        title: "Sahara Sunrise",
        content: "Watching the sunrise over the Sahara Desert from our camel's back. Some moments in life are absolutely priceless. Morocco has stolen my heart forever.",
        images: ["https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800"],
        location: "Sahara Desert, Morocco",
        latitude: "31.7917",
        longitude: "-7.0926",
        tags: ["Morocco", "Sahara", "camel", "desert", "sunrise"],
        isPublic: true,
        createdAt: new Date(now.getTime() - 24 * 36e5),
        updatedAt: new Date(now.getTime() - 24 * 36e5)
      },
      {
        id: "post3",
        userId: "demo-user",
        title: "Bangkok Street Food Tour",
        content: "Street food tour in Bangkok complete! Pad Thai, mango sticky rice, green curry and so much more. The food scene here is absolutely insane. Counting down the days until I can come back!",
        images: ["https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800"],
        location: "Bangkok, Thailand",
        latitude: "13.7563",
        longitude: "100.5018",
        tags: ["Bangkok", "Thailand", "food", "streetfood"],
        isPublic: true,
        createdAt: new Date(now.getTime() - 48 * 36e5),
        updatedAt: new Date(now.getTime() - 48 * 36e5)
      }
    ];
    samplePosts.forEach((p) => this.travelPosts.set(p.id, p));
  }
  // User operations
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByEmail(email) {
    const lower = email.trim().toLowerCase();
    return Array.from(this.users.values()).find(
      (u) => u.email?.toLowerCase() === lower
    );
  }
  async getUserByUsername(username) {
    const lower = username.trim().toLowerCase().replace(/^@/, "");
    return Array.from(this.users.values()).find(
      (u) => u.username?.toLowerCase() === lower
    );
  }
  async updateUserMe(userId, data) {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    const user = { ...existing, ...data, updatedAt: /* @__PURE__ */ new Date() };
    this.users.set(userId, user);
    return user;
  }
  async ensureUsernames() {
    const { generateUniqueUsername: generateUniqueUsername2 } = await Promise.resolve().then(() => (init_user_utils(), user_utils_exports));
    for (const user of Array.from(this.users.values())) {
      if (user.username || !user.email) continue;
      const username = await generateUniqueUsername2(this, user.email);
      await this.updateUserMe(user.id, { username });
    }
  }
  async upsertUser(userData) {
    const { resolveIsAdmin: resolveIsAdmin2 } = await Promise.resolve().then(() => (init_admin(), admin_exports));
    const existing = this.users.get(userData.id);
    const user = {
      ...existing,
      ...userData,
      isAdmin: resolveIsAdmin2(userData.email ?? void 0) || userData.isAdmin === true,
      createdAt: existing?.createdAt ?? /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(user.id, user);
    return user;
  }
  async setUserAdmin(userId, isAdmin) {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    const user = { ...existing, isAdmin, updatedAt: /* @__PURE__ */ new Date() };
    this.users.set(userId, user);
    return user;
  }
  async ensureAdminUsers() {
    const { getAdminEmails: getAdminEmails2 } = await Promise.resolve().then(() => (init_admin(), admin_exports));
    for (const email of getAdminEmails2()) {
      const user = await this.getUserByEmail(email);
      if (user && !user.isAdmin) {
        await this.setUserAdmin(user.id, true);
      }
    }
  }
  async setUserPassword(userId, passwordHash) {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    const user = { ...existing, passwordHash, updatedAt: /* @__PURE__ */ new Date() };
    this.users.set(userId, user);
    return user;
  }
  // Place operations
  async getPlaces(filters) {
    let results = Array.from(this.places.values());
    if (filters?.type) {
      results = results.filter((p) => p.type === filters.type);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    if (filters?.minRating != null) {
      results = results.filter((p) => parseFloat(p.averageRating ?? "0") >= filters.minRating);
    }
    if (filters?.priceRange) {
      results = results.filter((p) => p.priceRange === filters.priceRange);
    }
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }
  async getPlace(id) {
    return this.places.get(id);
  }
  async createPlace(place) {
    const id = genId();
    const newPlace = {
      ...place,
      id,
      reviewCount: 0,
      averageRating: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.places.set(id, newPlace);
    return newPlace;
  }
  async updatePlace(id, place) {
    const existing = this.places.get(id);
    if (!existing) throw new Error("Place not found");
    const updated = { ...existing, ...place };
    this.places.set(id, updated);
    return updated;
  }
  // Review operations
  async getReviewsByPlace(placeId) {
    return Array.from(this.reviews.values()).filter((r) => r.placeId === placeId);
  }
  async getReviewsByUser(userId) {
    return Array.from(this.reviews.values()).filter((r) => r.userId === userId);
  }
  async createReview(review) {
    const id = genId();
    const newReview = {
      ...review,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.reviews.set(id, newReview);
    await this.updatePlaceRating(review.placeId);
    return newReview;
  }
  async updatePlaceRating(placeId) {
    const placeReviews = await this.getReviewsByPlace(placeId);
    if (placeReviews.length === 0) return;
    const avg = placeReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / placeReviews.length;
    const place = this.places.get(placeId);
    if (place) {
      place.averageRating = avg.toFixed(1);
      place.reviewCount = placeReviews.length;
      this.places.set(placeId, place);
    }
  }
  // Trip operations
  async getTrips(filters) {
    let results = Array.from(this.trips.values());
    if (filters?.userId) {
      results = results.filter((t) => t.userId === filters.userId);
    }
    if (filters?.destination) {
      const q = filters.destination.toLowerCase();
      results = results.filter((t) => t.destination?.toLowerCase().includes(q));
    }
    if (filters?.startDate) {
      results = results.filter((t) => t.startDate && new Date(t.startDate) >= filters.startDate);
    }
    if (filters?.endDate) {
      results = results.filter((t) => t.endDate && new Date(t.endDate) <= filters.endDate);
    }
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }
  async getTrip(id) {
    return this.trips.get(id);
  }
  async createTrip(trip) {
    const id = genId();
    const newTrip = {
      ...trip,
      id,
      currentParticipants: 1,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.trips.set(id, newTrip);
    return newTrip;
  }
  async joinTrip(tripId, userId) {
    const id = genId();
    const participant = {
      id,
      tripId,
      userId,
      joinedAt: /* @__PURE__ */ new Date(),
      status: "confirmed"
    };
    this.tripParticipants.set(id, participant);
    const trip = this.trips.get(tripId);
    if (trip) {
      trip.currentParticipants = (trip.currentParticipants ?? 0) + 1;
      this.trips.set(tripId, trip);
    }
    return participant;
  }
  async getTripParticipants(tripId) {
    return Array.from(this.tripParticipants.values()).filter((p) => p.tripId === tripId);
  }
  async getTripParticipationsByUser(userId) {
    return Array.from(this.tripParticipants.values()).filter((p) => p.userId === userId).map((p) => p.tripId);
  }
  async getTripWaypoints(tripId) {
    const waypoints = Array.from(this.tripWaypoints.values()).filter((w) => w.tripId === tripId).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return Promise.all(
      waypoints.map(async (w) => {
        const place = await this.getPlace(w.placeId);
        return { ...w, place: place ?? null };
      })
    );
  }
  async addTripWaypoint(tripId, placeId, orderIndex, dayNumber) {
    const waypoints = Array.from(this.tripWaypoints.values()).filter((w) => w.tripId === tripId);
    const nextOrder = orderIndex ?? waypoints.length;
    const id = genId();
    const waypoint = {
      id,
      tripId,
      placeId,
      orderIndex: nextOrder,
      dayNumber: dayNumber ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.tripWaypoints.set(id, waypoint);
    return waypoint;
  }
  async updateTripWaypoint(waypointId, data) {
    const wp = this.tripWaypoints.get(waypointId);
    if (!wp) return void 0;
    const updated = {
      ...wp,
      ...data.orderIndex != null ? { orderIndex: data.orderIndex } : {},
      ...data.dayNumber != null ? { dayNumber: data.dayNumber } : {}
    };
    this.tripWaypoints.set(waypointId, updated);
    return updated;
  }
  async removeTripWaypoint(waypointId) {
    this.tripWaypoints.delete(waypointId);
  }
  // Event operations
  async getEvents(filters) {
    let results = Array.from(this.events.values());
    if (filters?.type) {
      results = results.filter((e) => e.type === filters.type);
    }
    if (filters?.upcoming) {
      const now = /* @__PURE__ */ new Date();
      results = results.filter((e) => e.startDate && new Date(e.startDate) > now);
    }
    results.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db2 = b.startDate ? new Date(b.startDate).getTime() : 0;
      return da - db2;
    });
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }
  async getEvent(id) {
    return this.events.get(id);
  }
  async createEvent(event) {
    const id = genId();
    const newEvent = {
      ...event,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.events.set(id, newEvent);
    return newEvent;
  }
  async registerForEvent(eventId, userId) {
    const existing = Array.from(this.eventRegistrations.values()).find(
      (r) => r.eventId === eventId && r.userId === userId
    );
    if (existing) return existing;
    const id = genId();
    const reg = { id, eventId, userId, createdAt: /* @__PURE__ */ new Date() };
    this.eventRegistrations.set(id, reg);
    return reg;
  }
  async unregisterFromEvent(eventId, userId) {
    for (const [key, r] of Array.from(this.eventRegistrations.entries())) {
      if (r.eventId === eventId && r.userId === userId) {
        this.eventRegistrations.delete(key);
      }
    }
  }
  async getRegisteredEventIds(userId) {
    return Array.from(this.eventRegistrations.values()).filter((r) => r.userId === userId).map((r) => r.eventId);
  }
  async isRegisteredForEvent(eventId, userId) {
    return Array.from(this.eventRegistrations.values()).some(
      (r) => r.eventId === eventId && r.userId === userId
    );
  }
  // Chat operations
  async getChatMessages(chatRoom, limit = 50) {
    const msgs = Array.from(this.chatMessages.values()).filter((m) => m.chatRoom === chatRoom).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return msgs.slice(-limit);
  }
  async createChatMessage(message) {
    const id = genId();
    const newMsg = {
      ...message,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.chatMessages.set(id, newMsg);
    return newMsg;
  }
  // Favorites operations
  async getUserFavorites(userId) {
    return Array.from(this.userFavorites.values()).filter((f) => f.userId === userId);
  }
  async addFavorite(userId, placeId) {
    const id = genId();
    const fav = { id, userId, placeId, createdAt: /* @__PURE__ */ new Date() };
    this.userFavorites.set(id, fav);
    return fav;
  }
  async removeFavorite(userId, placeId) {
    for (const [key, fav] of Array.from(this.userFavorites.entries())) {
      if (fav.userId === userId && fav.placeId === placeId) {
        this.userFavorites.delete(key);
      }
    }
  }
  async isFavorite(userId, placeId) {
    return Array.from(this.userFavorites.values()).some((f) => f.userId === userId && f.placeId === placeId);
  }
  // User profile operations
  async getUserProfile(userId) {
    return this.userProfiles.get(userId);
  }
  async createUserProfile(profile) {
    const id = genId();
    const newProfile = {
      ...profile,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.userProfiles.set(profile.userId, newProfile);
    return newProfile;
  }
  async updateUserProfile(userId, profile) {
    const existing = this.userProfiles.get(userId);
    if (!existing) {
      return this.createUserProfile({ userId, ...profile });
    }
    const updated = { ...existing, ...profile, updatedAt: /* @__PURE__ */ new Date() };
    this.userProfiles.set(userId, updated);
    return updated;
  }
  // Friend operations
  async sendFriendRequest(requesterId, addresseeId) {
    const id = genId();
    const friendship = {
      id,
      requesterId,
      addresseeId,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.friendships.set(id, friendship);
    return friendship;
  }
  async respondToFriendRequest(friendshipId, status) {
    const friendship = this.friendships.get(friendshipId);
    if (!friendship) throw new Error("Friendship not found");
    const updated = { ...friendship, status, updatedAt: /* @__PURE__ */ new Date() };
    this.friendships.set(friendshipId, updated);
    return updated;
  }
  async getFriends(userId) {
    const friendIds = [];
    for (const f of Array.from(this.friendships.values())) {
      if (f.status === "accepted") {
        if (f.requesterId === userId) friendIds.push(f.addresseeId);
        else if (f.addresseeId === userId) friendIds.push(f.requesterId);
      }
    }
    return friendIds.map((id) => this.users.get(id)).filter(Boolean);
  }
  async getFriendRequests(userId, type) {
    return Array.from(this.friendships.values()).filter((f) => {
      if (type === "sent") return f.requesterId === userId && f.status === "pending";
      return f.addresseeId === userId && f.status === "pending";
    });
  }
  async removeFriend(userId, friendId) {
    for (const [key, f] of Array.from(this.friendships.entries())) {
      if (f.requesterId === userId && f.addresseeId === friendId || f.requesterId === friendId && f.addresseeId === userId) {
        this.friendships.delete(key);
      }
    }
  }
  // Follow operations
  async followUser(followerId, followingId) {
    const id = genId();
    const follow = { id, followerId, followingId, createdAt: /* @__PURE__ */ new Date() };
    this.userFollows.set(id, follow);
    return follow;
  }
  async unfollowUser(followerId, followingId) {
    for (const [key, f] of Array.from(this.userFollows.entries())) {
      if (f.followerId === followerId && f.followingId === followingId) {
        this.userFollows.delete(key);
      }
    }
  }
  async getFollowers(userId) {
    const ids = Array.from(this.userFollows.values()).filter((f) => f.followingId === userId).map((f) => f.followerId);
    return ids.map((id) => this.users.get(id)).filter(Boolean);
  }
  async getFollowing(userId) {
    const ids = Array.from(this.userFollows.values()).filter((f) => f.followerId === userId).map((f) => f.followingId);
    return ids.map((id) => this.users.get(id)).filter(Boolean);
  }
  async isFollowing(followerId, followingId) {
    return Array.from(this.userFollows.values()).some((f) => f.followerId === followerId && f.followingId === followingId);
  }
  // Private message operations
  async sendPrivateMessage(message) {
    const id = genId();
    const newMsg = {
      ...message,
      id,
      isRead: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.privateMessages.set(id, newMsg);
    return newMsg;
  }
  async getPrivateMessages(userId1, userId2, limit = 50) {
    const msgs = Array.from(this.privateMessages.values()).filter(
      (m) => m.senderId === userId1 && m.receiverId === userId2 || m.senderId === userId2 && m.receiverId === userId1
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return msgs.slice(-limit);
  }
  async getConversations(userId) {
    const partnerIds = /* @__PURE__ */ new Set();
    for (const m of Array.from(this.privateMessages.values())) {
      if (m.senderId === userId) partnerIds.add(m.receiverId);
      else if (m.receiverId === userId) partnerIds.add(m.senderId);
    }
    const conversations = [];
    for (const partnerId of Array.from(partnerIds)) {
      const partner = this.users.get(partnerId);
      if (!partner) continue;
      const msgs = await this.getPrivateMessages(userId, partnerId);
      if (msgs.length === 0) continue;
      const lastMessage = msgs[msgs.length - 1];
      const unreadCount = msgs.filter((m) => m.receiverId === userId && !m.isRead).length;
      conversations.push({ user: partner, lastMessage, unreadCount });
    }
    return conversations.sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }
  async markMessagesAsRead(userId, senderId) {
    for (const [key, msg] of Array.from(this.privateMessages.entries())) {
      if (msg.receiverId === userId && msg.senderId === senderId && !msg.isRead) {
        this.privateMessages.set(key, { ...msg, isRead: true });
      }
    }
  }
  // Travel post operations
  async createTravelPost(post) {
    const id = genId();
    const newPost = {
      ...post,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.travelPosts.set(id, newPost);
    return newPost;
  }
  async getTravelPosts(filters) {
    let results = Array.from(this.travelPosts.values());
    if (filters?.publicOnly) {
      results = results.filter((p) => p.isPublic !== false);
    }
    if (filters?.userId) {
      results = results.filter((p) => p.userId === filters.userId);
    }
    if (filters?.following) {
      const followingIds = Array.from(this.userFollows.values()).filter((f) => f.followerId === filters.following).map((f) => f.followingId);
      results = results.filter((p) => followingIds.includes(p.userId));
    }
    if (filters?.tag) {
      const tag = filters.tag.toLowerCase();
      results = results.filter((p) => p.tags?.some((t) => t.toLowerCase() === tag));
    }
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }
  async getTravelPost(id) {
    return this.travelPosts.get(id);
  }
  async updateTravelPost(id, post) {
    const existing = this.travelPosts.get(id);
    if (!existing) throw new Error("Post not found");
    const updated = { ...existing, ...post, updatedAt: /* @__PURE__ */ new Date() };
    this.travelPosts.set(id, updated);
    return updated;
  }
  async deleteTravelPost(id) {
    this.travelPosts.delete(id);
  }
  // Post interaction operations
  async likePost(userId, postId) {
    const id = genId();
    const like = { id, userId, postId, createdAt: /* @__PURE__ */ new Date() };
    this.postLikes.set(id, like);
    return like;
  }
  async unlikePost(userId, postId) {
    for (const [key, like] of Array.from(this.postLikes.entries())) {
      if (like.userId === userId && like.postId === postId) {
        this.postLikes.delete(key);
        break;
      }
    }
  }
  async addPostComment(comment) {
    const id = genId();
    const newComment = {
      ...comment,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.postComments.set(id, newComment);
    return newComment;
  }
  async getPostComments(postId) {
    return Array.from(this.postComments.values()).filter((c) => c.postId === postId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  async getPostComment(id) {
    return this.postComments.get(id);
  }
  async deletePostComment(id) {
    this.postComments.delete(id);
  }
  // Search operations
  async searchUsers(query, limit = 10) {
    const q = query.toLowerCase().replace(/^@/, "");
    return Array.from(this.users.values()).filter(
      (u) => u.username?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ).slice(0, limit);
  }
  async getPostLikesCount(postId) {
    return Array.from(this.postLikes.values()).filter((l) => l.postId === postId).length;
  }
  async isPostLikedByUser(userId, postId) {
    return Array.from(this.postLikes.values()).some((l) => l.userId === userId && l.postId === postId);
  }
  async getPostCommentsCount(postId) {
    return Array.from(this.postComments.values()).filter((c) => c.postId === postId).length;
  }
  async getUserTrips(userId) {
    return this.getTrips({ userId });
  }
};
async function initAppStorage() {
  try {
    if (storage instanceof PgStorage) {
      await storage.ensureSchema();
      await storage.ensureSeeded();
    }
    if (storage.ensureAdminUsers) {
      await storage.ensureAdminUsers();
    }
    if (storage.ensureUsernames) {
      await storage.ensureUsernames();
    }
  } catch (error) {
    console.error("initAppStorage failed (app will continue):", error);
  }
}
function createStorage() {
  if (isDatabaseConfigured() && getDb()) {
    return new PgStorage();
  }
  return new MemStorage();
}
var storage = createStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
init_db();

// server/google-auth.ts
import * as client from "openid-client";
var googleConfig = null;
function getAppBaseUrl() {
  return process.env.APP_URL || `http://localhost:${process.env.PORT || 5e3}`;
}
async function getGoogleConfig() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  if (!googleConfig) {
    googleConfig = await client.discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID,
      { client_secret: process.env.GOOGLE_CLIENT_SECRET }
    );
  }
  return googleConfig;
}
async function setupGoogleAuth(app) {
  let config2 = null;
  try {
    config2 = await getGoogleConfig();
  } catch (err) {
    console.error("[auth] Google discovery failed:", err);
    return;
  }
  if (!config2) {
    console.log("[auth] Google OAuth not configured (missing GOOGLE_CLIENT_ID/SECRET)");
    return;
  }
  const redirectUri = `${getAppBaseUrl()}/api/auth/google/callback`;
  app.get("/api/auth/google", async (req, res) => {
    try {
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      req.session.oauthCodeVerifier = codeVerifier;
      const rawRedirect = typeof req.query.state === "string" ? req.query.state : "/";
      const oauthState = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://") ? rawRedirect : "/";
      const authUrl = client.buildAuthorizationUrl(config2, {
        redirect_uri: redirectUri,
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: oauthState
      });
      res.redirect(authUrl.href);
    } catch (err) {
      console.error("Google auth start error:", err);
      res.redirect("/login?error=invalid");
    }
  });
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const codeVerifier = req.session.oauthCodeVerifier;
      if (!codeVerifier) {
        return res.redirect("/login?error=invalid");
      }
      const currentUrl = new URL(`${getAppBaseUrl()}${req.originalUrl}`);
      const tokens = await client.authorizationCodeGrant(config2, currentUrl, {
        pkceCodeVerifier: codeVerifier
      });
      const claims = tokens.claims();
      const email = claims?.email?.trim().toLowerCase();
      if (!email) {
        return res.redirect("/login?error=invalid");
      }
      let user = await storage.getUserByEmail(email);
      if (!user) {
        const { generateUniqueUsername: generateUniqueUsername2 } = await Promise.resolve().then(() => (init_user_utils(), user_utils_exports));
        const username = await generateUniqueUsername2(storage, email);
        user = await storage.upsertUser({
          id: crypto.randomUUID(),
          email,
          username,
          firstName: claims?.given_name ?? null,
          lastName: claims?.family_name ?? null,
          profileImageUrl: claims?.picture ?? null
        });
      } else if (!user.isAdmin) {
        const { resolveIsAdmin: resolveIsAdmin2 } = await Promise.resolve().then(() => (init_admin(), admin_exports));
        if (resolveIsAdmin2(email)) {
          user = await storage.setUserAdmin(user.id, true);
        }
      }
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email ?? void 0,
          first_name: user.firstName ?? void 0,
          last_name: user.lastName ?? void 0,
          profile_image_url: user.profileImageUrl ?? void 0
        }
      };
      delete req.session.oauthCodeVerifier;
      req.logIn(sessionUser, (err) => {
        if (err) {
          console.error("Google login session error:", err);
          return res.redirect("/login?error=invalid");
        }
        const rawRedirect = typeof req.query.state === "string" ? req.query.state : "/";
        const safeRedirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
        res.redirect(safeRedirect);
      });
    } catch (err) {
      console.error("Google auth callback error:", err);
      res.redirect("/login?error=invalid");
    }
  });
  console.log("[auth] Google OAuth enabled");
}
function isGoogleAuthEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// server/password.ts
import bcrypt from "bcryptjs";
var SALT_ROUNDS = 12;
var MIN_PASSWORD_LENGTH = 8;
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function isPasswordLongEnough(password) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

// server/auth.ts
init_admin();
async function syncAdminRole(user) {
  if (!resolveIsAdmin(user.email) || user.isAdmin) return user;
  return storage.setUserAdmin(user.id, true);
}
var SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
var PgSession = connectPgSimple(session);
var MemoryStore = createMemoryStore(session);
var sessionMiddleware = null;
function getSession() {
  if (sessionMiddleware) return sessionMiddleware;
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const pgPool = getSessionPool();
  let store;
  try {
    store = pgPool ? new PgSession({
      pool: pgPool,
      tableName: "sessions",
      createTableIfMissing: true
    }) : new MemoryStore({ checkPeriod: 864e5 });
  } catch (err) {
    console.error("[auth] session store init failed, using memory:", err);
    store = new MemoryStore({ checkPeriod: 864e5 });
  }
  sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: sessionTtl,
      path: "/"
    }
  });
  return sessionMiddleware;
}
function toSessionUser(user) {
  return {
    claims: {
      sub: user.id,
      email: user.email ?? void 0,
      first_name: user.firstName ?? void 0,
      last_name: user.lastName ?? void 0,
      profile_image_url: user.profileImageUrl ?? void 0
    }
  };
}
async function setupAuth(app) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  const googleTimeoutMs = process.env.VERCEL ? 2e3 : 1e4;
  try {
    await Promise.race([
      setupGoogleAuth(app),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Google OAuth setup timeout")), googleTimeoutMs)
      )
    ]);
  } catch (err) {
    console.error("[auth] Google OAuth setup skipped:", err);
  }
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, _password, done) => {
        try {
          const trimmed = (email || "").trim().toLowerCase();
          const password = String(_password ?? "");
          if (!trimmed) {
            return done(null, false, { message: "Email is required" });
          }
          if (!isPasswordLongEnough(password)) {
            return done(null, false, { message: "Invalid email or password" });
          }
          let user = await storage.getUserByEmail(trimmed);
          if (!user) {
            const id = crypto.randomUUID();
            const passwordHash = await hashPassword(password);
            const { generateUniqueUsername: generateUniqueUsername2 } = await Promise.resolve().then(() => (init_user_utils(), user_utils_exports));
            const username = await generateUniqueUsername2(storage, trimmed);
            user = await storage.upsertUser({
              id,
              email: trimmed,
              username,
              firstName: null,
              lastName: null,
              profileImageUrl: null,
              passwordHash
            });
            user = await syncAdminRole(user);
            return done(null, toSessionUser(user));
          }
          if (!user.passwordHash) {
            const passwordHash = await hashPassword(password);
            user = await storage.setUserPassword(user.id, passwordHash);
            user = await syncAdminRole(user);
            return done(null, toSessionUser(user));
          }
          const valid = await verifyPassword(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          user = await syncAdminRole(user);
          return done(null, toSessionUser(user));
        } catch (err) {
          console.error("[auth] local strategy error:", err);
          return done(err);
        }
      }
    )
  );
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app.get("/api/login", (_req, res) => {
    res.redirect("/login");
  });
  app.post(
    "/api/login",
    (req, res, next) => {
      const rawRedirect = typeof req.query.redirect === "string" ? req.query.redirect : "/";
      const safeRedirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://") ? rawRedirect : "/";
      passport.authenticate("local", (err, user) => {
        if (err) {
          console.error("[auth] POST /api/login authenticate:", err);
          const q = new URLSearchParams({ error: "server" });
          if (safeRedirect !== "/") q.set("redirect", safeRedirect);
          return res.redirect(`/login?${q.toString()}`);
        }
        if (!user) {
          const q = new URLSearchParams({ error: "invalid" });
          if (safeRedirect !== "/") q.set("redirect", safeRedirect);
          return res.redirect(`/login?${q.toString()}`);
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("[auth] session save failed:", loginErr);
            const q = new URLSearchParams({ error: "server" });
            if (safeRedirect !== "/") q.set("redirect", safeRedirect);
            return res.redirect(`/login?${q.toString()}`);
          }
          return res.redirect(safeRedirect);
        });
      })(req, res, next);
    }
  );
  const handleLogout = (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.redirect("/");
      }
      res.redirect("/");
    });
  };
  app.get("/api/logout", handleLogout);
  app.post("/api/logout", handleLogout);
}
var isAuthenticated = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// server/routes.ts
init_nominatim();
init_schema();
init_username();
init_user_utils();
import passport2 from "passport";
import { z } from "zod";
var updateUserMeSchema = z.object({
  displayName: z.string().max(64).nullable().optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  username: z.string().optional()
});
async function registerRoutes(app) {
  await setupAuth(app);
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
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      if (!allowGeoRequest(`geo:${ip}`)) {
        return res.status(429).json({ message: "Too many requests" });
      }
      const acceptLanguage = req.headers["accept-language"] ?? (typeof req.query.lang === "string" ? req.query.lang : void 0);
      const { resolveGeoAutocomplete: resolveGeoAutocomplete2 } = await Promise.resolve().then(() => (init_resolve_autocomplete(), resolve_autocomplete_exports));
      const items = await resolveGeoAutocomplete2({ q, limit, scope, acceptLanguage });
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
      const type = typeof req.query.type === "string" ? req.query.type : void 0;
      if (q.length < 2) {
        return res.json({ locations: [], places: [] });
      }
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      if (!allowGeoRequest(`search:${ip}`)) {
        return res.status(429).json({ message: "Too many requests" });
      }
      const acceptLanguage = req.headers["accept-language"] ?? (typeof req.query.lang === "string" ? req.query.lang : void 0);
      const { resolveGeoAutocomplete: resolveGeoAutocomplete2 } = await Promise.resolve().then(() => (init_resolve_autocomplete(), resolve_autocomplete_exports));
      const geoLimit = Math.min(8, limit);
      const [locations, places2] = await Promise.all([
        resolveGeoAutocomplete2({ q, limit: geoLimit, scope: "all", acceptLanguage }),
        storage.getPlaces({
          search: q,
          type: type && type !== "all" ? type : void 0,
          limit: Math.min(10, limit)
        })
      ]);
      res.json({ locations, places: places2 });
    } catch (error) {
      console.error("Error searching destinations:", error);
      res.status(500).json({ message: "Failed to search destinations" });
    }
  });
  app.get("/api/geo/status", async (_req, res) => {
    try {
      let countries2 = 0;
      let cities2 = 0;
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db2 = getDb2();
      if (db2) {
        const { countries: countriesTable, cities: citiesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const { count: count2 } = await import("drizzle-orm");
        const [c1] = await db2.select({ value: count2() }).from(countriesTable);
        const [c2] = await db2.select({ value: count2() }).from(citiesTable);
        countries2 = Number(c1?.value ?? 0);
        cities2 = Number(c2?.value ?? 0);
      }
      const {
        isAnyYandexGeoConfigured: isAnyYandexGeoConfigured2,
        isYandexGeocoderConfigured: isYandexGeocoderConfigured2,
        isYandexGeosuggestConfigured: isYandexGeosuggestConfigured2,
        isYandexRouterConfigured: isYandexRouterConfigured2
      } = await Promise.resolve().then(() => (init_yandex_config(), yandex_config_exports));
      res.json({
        database: Boolean(process.env.DATABASE_URL),
        geoImported: countries2 > 0 && cities2 > 0,
        countries: countries2,
        cities: cities2,
        yandexGeosuggest: isYandexGeosuggestConfigured2(),
        yandexGeocoder: isYandexGeocoderConfigured2(),
        yandexRouter: isYandexRouterConfigured2(),
        yandex: isAnyYandexGeoConfigured2(),
        nominatimFallback: true
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
      emailSignup: true
    });
  });
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const sessionUser = req.user;
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
  app.put("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = updateUserMeSchema.parse(req.body);
      const patch = {};
      if (body.displayName !== void 0) patch.displayName = body.displayName;
      if (body.firstName !== void 0) patch.firstName = body.firstName;
      if (body.lastName !== void 0) patch.lastName = body.lastName;
      if (body.username !== void 0) {
        const parsed = validateUsername(body.username);
        if (!parsed.ok) {
          return res.status(400).json({ message: parsed.message });
        }
        const taken = await storage.getUserByUsername(parsed.value);
        if (taken && taken.id !== userId) {
          return res.status(409).json({ message: "\u042D\u0442\u043E\u0442 \u043D\u0438\u043A \u0443\u0436\u0435 \u0437\u0430\u043D\u044F\u0442" });
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
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const sessionUser = req.isAuthenticated() ? req.user : void 0;
      const viewerId = sessionUser?.claims?.sub;
      if (viewerId === user.id) {
        return res.json(toSelfUser(user));
      }
      res.json(toPublicUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app.get("/api/places", async (req, res) => {
    try {
      const { type, search, minRating, priceRange, limit = 20, offset = 0 } = req.query;
      const places2 = await storage.getPlaces({
        type,
        search,
        minRating: minRating ? Number(minRating) : void 0,
        priceRange,
        limit: Number(limit),
        offset: Number(offset)
      });
      res.json(places2);
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
  app.get("/api/places/:id/reviews", async (req, res) => {
    try {
      const reviews2 = await storage.getReviewsByPlace(req.params.id);
      res.json(reviews2);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app.post("/api/places/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
        placeId: req.params.id
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
  app.get("/api/reviews/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews2 = await storage.getReviewsByUser(userId);
      const enriched = await Promise.all(reviews2.map(async (review) => {
        const place = await storage.getPlace(review.placeId);
        return { ...review, place: place || null };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });
  app.get("/api/trips", async (req, res) => {
    try {
      const { userId, destination, startDate, endDate, limit = 20, offset = 0 } = req.query;
      const trips2 = await storage.getTrips({
        userId,
        destination,
        startDate: startDate ? new Date(startDate) : void 0,
        endDate: endDate ? new Date(endDate) : void 0,
        limit: Number(limit),
        offset: Number(offset)
      });
      res.json(trips2);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });
  app.get("/api/trips/my-participations", isAuthenticated, async (req, res) => {
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
      const { isYandexRouterConfigured: isYandexRouterConfigured2 } = await Promise.resolve().then(() => (init_yandex_config(), yandex_config_exports));
      if (!isYandexRouterConfigured2()) {
        return res.status(503).json({ message: "Yandex Router API key not configured" });
      }
      const waypoints = await storage.getTripWaypoints(req.params.id);
      const points = waypoints.filter((w) => w.place?.latitude != null && w.place?.longitude != null).map((w) => ({
        lat: Number(w.place.latitude),
        lon: Number(w.place.longitude)
      }));
      if (points.length < 2) {
        return res.json({ configured: true, route: null, message: "Need at least 2 stops" });
      }
      const mode = req.query.mode === "walking" || req.query.mode === "driving" ? req.query.mode : "driving";
      const { yandexBuildRoute: yandexBuildRoute2 } = await Promise.resolve().then(() => (init_yandex_router(), yandex_router_exports));
      const route = await yandexBuildRoute2(points, mode);
      if (!route) {
        return res.json({ configured: true, route: null });
      }
      res.json({
        configured: true,
        route: {
          distanceKm: Math.round(route.distanceM / 1e3 * 10) / 10,
          durationMin: Math.round(route.durationS / 60),
          geometry: route.geometry
        }
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
      const { yandexForwardGeocode: yandexForwardGeocode2 } = await Promise.resolve().then(() => (init_yandex(), yandex_exports));
      const result = await yandexForwardGeocode2(q);
      res.json(result);
    } catch (error) {
      console.error("Error geocoding:", error);
      res.status(500).json({ message: "Failed to geocode" });
    }
  });
  app.post("/api/trips/:id/waypoints", isAuthenticated, async (req, res) => {
    try {
      const { placeId, orderIndex, dayNumber } = req.body;
      const waypoint = await storage.addTripWaypoint(
        req.params.id,
        placeId,
        orderIndex != null ? Number(orderIndex) : void 0,
        dayNumber != null ? Number(dayNumber) : void 0
      );
      res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error adding waypoint:", error);
      res.status(500).json({ message: "Failed to add waypoint" });
    }
  });
  app.patch("/api/trips/:id/waypoints/:waypointId", isAuthenticated, async (req, res) => {
    try {
      const { orderIndex, dayNumber } = req.body;
      const waypoint = await storage.updateTripWaypoint(req.params.waypointId, {
        orderIndex: orderIndex != null ? Number(orderIndex) : void 0,
        dayNumber: dayNumber != null ? Number(dayNumber) : void 0
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
  app.delete("/api/trips/:id/waypoints/:waypointId", isAuthenticated, async (req, res) => {
    try {
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
  app.post("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = insertTripSchema.parse({
        ...req.body,
        userId
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
  app.post("/api/trips/:id/join", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const participant = await storage.joinTrip(req.params.id, userId);
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining trip:", error);
      res.status(500).json({ message: "Failed to join trip" });
    }
  });
  app.get("/api/events", async (req, res) => {
    try {
      const { type, upcoming, limit = 20, offset = 0 } = req.query;
      const events2 = await storage.getEvents({
        type,
        upcoming: upcoming === "true",
        limit: Number(limit),
        offset: Number(offset)
      });
      res.json(events2);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({
        ...req.body,
        organizerId: userId
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
  app.get("/api/events/registrations", isAuthenticated, async (req, res) => {
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
  app.post("/api/events/:id/register", isAuthenticated, async (req, res) => {
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
  app.delete("/api/events/:id/register", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unregisterFromEvent(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unregistering from event:", error);
      res.status(500).json({ message: "Failed to unregister" });
    }
  });
  app.get("/api/trips/:id/participants", async (req, res) => {
    try {
      const participants = await storage.getTripParticipants(req.params.id);
      const enriched = await Promise.all(
        participants.map(async (p) => ({
          ...p,
          user: p.userId ? await storage.getUser(p.userId) : null
        }))
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });
  app.get("/api/follow/:userId/check", isAuthenticated, async (req, res) => {
    try {
      const followerId = req.user.claims.sub;
      const isFollowing = await storage.isFollowing(followerId, req.params.userId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const [receivedRequests, conversations] = await Promise.all([
        storage.getFriendRequests(userId, "received"),
        storage.getConversations(userId)
      ]);
      const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      res.json({
        friendRequests: receivedRequests.length,
        unreadMessages,
        items: [
          ...receivedRequests.map((r) => ({
            type: "friend_request",
            id: r.id,
            message: "\u041D\u043E\u0432\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0432 \u0434\u0440\u0443\u0437\u044C\u044F"
          })),
          ...conversations.filter((c) => c.unreadCount > 0).map((c) => ({
            type: "message",
            id: c.user.id,
            message: `\u041D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0445: ${c.unreadCount} \u043E\u0442 ${c.user.firstName || "\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"}`
          }))
        ]
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  const enrichChatMessages = async (messages) => Promise.all(
    messages.map(async (msg) => {
      const sender = msg.userId ? await storage.getUser(msg.userId) : null;
      return {
        ...msg,
        sender: sender ? toPublicUser(sender) : null
      };
    })
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
  app.post("/api/chat/:room", isAuthenticated, async (req, res) => {
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
        chatRoom: room
      });
      const savedMessage = await storage.createChatMessage(messageData);
      const sender = await storage.getUser(userId);
      res.status(201).json({
        ...savedMessage,
        sender: sender ? {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          profileImageUrl: sender.profileImageUrl
        } : null
      });
    } catch (error) {
      console.error("Error posting chat message:", error);
      res.status(500).json({ message: "Failed to post message" });
    }
  });
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
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
  app.post("/api/favorites/:placeId", isAuthenticated, async (req, res) => {
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
  app.delete("/api/favorites/:placeId", isAuthenticated, async (req, res) => {
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
  app.get("/api/favorites/:placeId/check", isAuthenticated, async (req, res) => {
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
  app.get("/api/profile/:userId", async (req, res) => {
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
  app.post("/api/profile", isAuthenticated, async (req, res) => {
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
  app.put("/api/profile", isAuthenticated, async (req, res) => {
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
  app.post("/api/friends/request/:userId", isAuthenticated, async (req, res) => {
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
  app.put("/api/friends/respond/:friendshipId", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const friendship = await storage.respondToFriendRequest(req.params.friendshipId, status);
      res.json(friendship);
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });
  app.get("/api/friends", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends.map(toPublicUser));
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });
  app.get("/api/friends/requests/:type", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.params.type;
      const requests = await storage.getFriendRequests(userId, type);
      const enriched = await Promise.all(requests.map(async (friendship) => {
        const otherUserId = type === "sent" ? friendship.addresseeId : friendship.requesterId;
        const user = await storage.getUser(otherUserId);
        return { ...friendship, user: user ? toPublicUser(user) : null };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });
  app.delete("/api/friends/:friendId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFriend(userId, req.params.friendId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });
  app.post("/api/follow/:userId", isAuthenticated, async (req, res) => {
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
  app.delete("/api/follow/:userId", isAuthenticated, async (req, res) => {
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
  app.post("/api/messages", isAuthenticated, async (req, res) => {
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
  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
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
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(
        conversations.map((c) => ({
          ...c,
          user: toPublicUser(c.user)
        }))
      );
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app.put("/api/messages/read/:senderId", isAuthenticated, async (req, res) => {
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
  app.post("/api/posts", isAuthenticated, async (req, res) => {
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
  app.get("/api/posts", async (req, res) => {
    try {
      const { userId, following, tag, public: publicFilter, limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.claims?.sub || null;
      const posts = await storage.getTravelPosts({
        userId,
        following,
        tag,
        publicOnly: publicFilter === "1" || publicFilter === "true",
        limit: Number(limit),
        offset: Number(offset)
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
          isLiked
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getTravelPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const currentUserId = req.user?.claims?.sub || null;
      if (!post.isPublic && post.userId !== currentUserId) {
        return res.status(404).json({ message: "Post not found" });
      }
      const author = post.userId ? await storage.getUser(post.userId) : null;
      res.json({
        ...post,
        author: author ? { id: author.id, firstName: author.firstName, lastName: author.lastName, profileImageUrl: author.profileImageUrl } : null
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });
  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
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
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
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
  app.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
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
  app.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
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
  app.post("/api/posts/:id/comments", isAuthenticated, async (req, res) => {
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
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/search/users", async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const users2 = await storage.searchUsers(q, Number(limit));
      res.json(users2.map(toPublicUser));
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });
  if (process.env.VERCEL) {
    return app;
  }
  const httpServer = createServer(app);
  if (!process.env.VERCEL) {
    const { WebSocketServer, WebSocket } = await import("ws");
    const sessionParser = getSession();
    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
    wss.on("connection", (ws, req) => {
      let authenticatedUserId = null;
      const runSession = (cb) => {
        sessionParser(req, {}, () => {
          passport2.initialize()(req, {}, () => {
            passport2.session()(req, {}, cb);
          });
        });
      };
      runSession(() => {
        const user = req.user;
        authenticatedUserId = user?.claims?.sub ?? null;
      });
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === "chat_message") {
            const userId = authenticatedUserId ?? data.userId;
            if (!userId) {
              ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
              return;
            }
            const messageData = insertChatMessageSchema.parse({
              userId,
              content: data.content,
              chatRoom: data.chatRoom
            });
            const savedMessage = await storage.createChatMessage(messageData);
            const sender = await storage.getUser(savedMessage.userId);
            wss.clients.forEach((client2) => {
              if (client2.readyState === WebSocket.OPEN) {
                client2.send(JSON.stringify({
                  type: "new_message",
                  message: savedMessage,
                  sender: sender ? toPublicUser(sender) : null
                }));
              }
            });
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          ws.send(JSON.stringify({
            type: "error",
            message: "Failed to process message"
          }));
        }
      });
      ws.on("close", () => {
        console.log("Client disconnected from WebSocket");
      });
    });
  }
  return httpServer;
}

// server/upload.ts
import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
function resolveUploadsDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "ait-uploads");
  }
  return path.resolve(process.cwd(), "uploads");
}
var uploadsDir = null;
function getUploadsDir() {
  if (uploadsDir) return uploadsDir;
  uploadsDir = resolveUploadsDir();
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err) {
    console.error("[upload] failed to create uploads dir, using /tmp:", err);
    uploadsDir = path.join("/tmp", "ait-uploads-fallback");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }
  return uploadsDir;
}
function createUploadMiddleware() {
  const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, getUploadsDir()),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  });
  return multer({
    storage: diskStorage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok =
        file.mimetype.startsWith("image/") ||
        file.mimetype === "video/mp4" ||
        file.mimetype === "video/webm" ||
        file.mimetype === "video/quicktime";
      if (ok) cb(null, true);
      else cb(new Error("Only images and videos (mp4, webm) allowed"));
    }
  });
}
function setupUploadRoutes(app) {
  const dir = getUploadsDir();
  const upload = createUploadMiddleware();
  app.use("/uploads", express.static(dir));
  app.post("/api/upload", isAuthenticated, upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
  app.post("/api/users/avatar", isAuthenticated, upload.single("file"), async (req, res) => {
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

// server/push.ts
import webpush from "web-push";
var subscriptions = /* @__PURE__ */ new Map();
function setupPushRoutes(app) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@allintravel.app";
  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: publicKey ?? null });
  });
  app.post("/api/push/subscribe", isAuthenticated, (req, res) => {
    const userId = req.user.claims.sub;
    const sub = req.body;
    if (!sub?.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    subscriptions.set(userId, sub);
    res.status(201).json({ ok: true });
  });
  app.post("/api/push/test", isAuthenticated, async (req, res) => {
    if (!publicKey || !privateKey) {
      return res.status(503).json({ message: "Push not configured" });
    }
    const userId = req.user.claims.sub;
    const sub = subscriptions.get(userId);
    if (!sub) {
      return res.status(404).json({ message: "No subscription" });
    }
    try {
      await webpush.sendNotification(
        sub,
        JSON.stringify({ title: "All In Travel", body: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442!" })
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("Push error:", err);
      res.status(500).json({ message: "Failed to send push" });
    }
  });
}

// server/createApp.ts
var INIT_TIMEOUT_MS = 12e3;
async function createApp() {
  const app = express2();
  app.use(express2.json());
  app.use(express2.urlencoded({ extended: false }));
  app.get("/api/health", async (_req, res) => {
    let dbOk = false;
    let dbError;
    if (process.env.DATABASE_URL) {
      try {
        const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const db2 = getDb2();
        if (db2) {
          const { sql: sql3 } = await import("drizzle-orm");
          await Promise.race([
            db2.execute(sql3`SELECT 1`),
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5e3))
          ]);
          dbOk = true;
        }
      } catch (e) {
        dbError = e instanceof Error ? e.message : String(e);
      }
    }
    res.json({
      ok: true,
      vercel: Boolean(process.env.VERCEL),
      databaseUrl: Boolean(process.env.DATABASE_URL),
      database: dbOk,
      dbError,
      sessionSecret: Boolean(process.env.SESSION_SECRET)
    });
  });
  app.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path2.startsWith("/api")) {
        let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        console.log(logLine);
      }
    });
    next();
  });
  setupUploadRoutes(app);
  setupPushRoutes(app);
  let server;
  try {
    server = await registerRoutes(app);
  } catch (error) {
    console.error("[createApp] registerRoutes failed:", error);
    server = createServer2(app);
  }
  const runStorageInit = () => {
    initAppStorage().catch((error) => {
      console.error("[createApp] initAppStorage failed (continuing):", error);
    });
  };
  if (process.env.VERCEL) {
    runStorageInit();
  } else {
    try {
      await Promise.race([
        initAppStorage(),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("initAppStorage timeout")), INIT_TIMEOUT_MS)
        )
      ]);
    } catch (error) {
      console.error("[createApp] initAppStorage failed (continuing):", error);
    }
  }
  app.use((err, _req, res, _next) => {
    const e = err;
    const status = e.status || e.statusCode || 500;
    const message = e.message || "Internal Server Error";
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
  const isVercel = Boolean(process.env.VERCEL);
  const isDev = process.env.NODE_ENV !== "production" && !isVercel;
  if (isDev) {
    const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite_stub(), vite_stub_exports));
    await setupVite2(app, server);
  } else if (!isVercel) {
    const { serveStatic: serveStatic2 } = await Promise.resolve().then(() => (init_vite_stub(), vite_stub_exports));
    serveStatic2(app);
  }
  return { app, server };
}

// server/vercel/handler.ts
var appPromise = null;
async function getApp() {
  if (!appPromise) {
    const { app } = await createApp();
    appPromise = Promise.resolve(app);
  }
  return appPromise;
}
var config = {
  maxDuration: 60,
  memory: 1024
};
function runExpress(app, req, res) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    res.once("finish", done);
    res.once("close", done);
    res.once("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    try {
      app(req, res, (err) => {
        if (err && !settled) {
          settled = true;
          reject(err);
        }
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        reject(err);
      }
    }
  });
}
async function handler(req, res) {
  try {
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api] unhandled error:", detail);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal Server Error",
        detail,
        hint: "Check Vercel logs, DATABASE_URL, SESSION_SECRET, and npm run db:push."
      });
    }
  }
}
export {
  config,
  handler as default
};
