var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel/health.ts
import { sql as sql2 } from "drizzle-orm";

// server/db.ts
import "dotenv/config";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool as NodePgPool } from "pg";

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
var countries = pgTable(
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
var cities = pgTable(
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
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
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
var places = pgTable("places", {
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
var reviews = pgTable("reviews", {
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
var trips = pgTable("trips", {
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
var tripParticipants = pgTable("trip_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending"),
  // pending, accepted, rejected
  joinedAt: timestamp("joined_at").defaultNow()
});
var tripWaypoints = pgTable("trip_waypoints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  dayNumber: integer("day_number"),
  createdAt: timestamp("created_at").defaultNow()
});
var events = pgTable("events", {
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
var eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  chatRoom: varchar("chat_room", { length: 100 }).notNull(),
  // e.g., "general", "rome", "paris"
  createdAt: timestamp("created_at").defaultNow()
});
var userFavorites = pgTable("user_favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
});
var friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending"),
  // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userFollows = pgTable("user_follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
});
var privateMessages = pgTable("private_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var travelPosts = pgTable("travel_posts", {
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
var postLikes = pgTable("post_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => travelPosts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
});
var postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => travelPosts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userProfiles = pgTable("user_profiles", {
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
var usersRelations = relations(users, ({ one, many }) => ({
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
var placesRelations = relations(places, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(userFavorites)
}));
var reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  place: one(places, { fields: [reviews.placeId], references: [places.id] })
}));
var tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  participants: many(tripParticipants),
  waypoints: many(tripWaypoints)
}));
var tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
  trip: one(trips, { fields: [tripParticipants.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripParticipants.userId], references: [users.id] })
}));
var tripWaypointsRelations = relations(tripWaypoints, ({ one }) => ({
  trip: one(trips, { fields: [tripWaypoints.tripId], references: [trips.id] }),
  place: one(places, { fields: [tripWaypoints.placeId], references: [places.id] })
}));
var eventsRelations = relations(events, ({ one }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] })
}));
var chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] })
}));
var userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, { fields: [userFavorites.userId], references: [users.id] }),
  place: one(places, { fields: [userFavorites.placeId], references: [places.id] })
}));
var friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, { fields: [friendships.requesterId], references: [users.id], relationName: "requester" }),
  addressee: one(users, { fields: [friendships.addresseeId], references: [users.id], relationName: "addressee" })
}));
var userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, { fields: [userFollows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [userFollows.followingId], references: [users.id], relationName: "following" })
}));
var privateMessagesRelations = relations(privateMessages, ({ one }) => ({
  sender: one(users, { fields: [privateMessages.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [privateMessages.receiverId], references: [users.id], relationName: "receiver" })
}));
var travelPostsRelations = relations(travelPosts, ({ one, many }) => ({
  user: one(users, { fields: [travelPosts.userId], references: [users.id] }),
  likes: many(postLikes),
  comments: many(postComments)
}));
var postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
  post: one(travelPosts, { fields: [postLikes.postId], references: [travelPosts.id] })
}));
var postCommentsRelations = relations(postComments, ({ one }) => ({
  user: one(users, { fields: [postComments.userId], references: [users.id] }),
  post: one(travelPosts, { fields: [postComments.postId], references: [travelPosts.id] })
}));
var userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] })
}));
var insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true
});
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  currentParticipants: true,
  createdAt: true,
  updatedAt: true
});
var insertTripWaypointSchema = createInsertSchema(tripWaypoints).omit({
  id: true,
  createdAt: true
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});
var insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true
});
var insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({
  id: true,
  createdAt: true
});
var insertTravelPostSchema = createInsertSchema(travelPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true
});
var insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
var poolInstance = null;
var dbInstance = null;
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
function getPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (poolInstance) return poolInstance;
  poolInstance = new NodePgPool(pgPoolOptions(url, process.env.VERCEL ? 4 : 10));
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
var db = new Proxy({}, {
  get(_target, prop) {
    const real = getDb();
    if (!real) {
      throw new Error("DATABASE_URL must be set.");
    }
    return Reflect.get(real, prop);
  }
});
var pool = new Proxy({}, {
  get(_target, prop) {
    const real = getPool();
    if (!real) {
      throw new Error("DATABASE_URL must be set.");
    }
    return Reflect.get(real, prop);
  }
});

// server/vercel/health.ts
var config = { maxDuration: 30 };
async function handler(_req, res) {
  let database = false;
  let dbError;
  if (process.env.DATABASE_URL) {
    try {
      const db2 = getDb();
      if (db2) {
        await db2.execute(sql2`SELECT 1`);
        database = true;
      }
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }
  res.status(200).json({
    ok: true,
    lite: true,
    vercel: Boolean(process.env.VERCEL),
    databaseUrl: Boolean(process.env.DATABASE_URL),
    database,
    dbError,
    sessionSecret: Boolean(process.env.SESSION_SECRET)
  });
}
export {
  config,
  handler as default
};
