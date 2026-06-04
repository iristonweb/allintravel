import { sql } from 'drizzle-orm';
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
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Geo reference tables (countries & major cities)
export const countries = pgTable(
  "countries",
  {
    code: varchar("code", { length: 2 }).primaryKey(), // ISO2
    name: varchar("name", { length: 128 }).notNull(),
    capitalName: varchar("capital_name", { length: 128 }),
    continent: varchar("continent", { length: 2 }),
    currency: varchar("currency", { length: 3 }),
    phone: varchar("phone", { length: 32 }),
  },
  (t) => [index("IDX_countries_name").on(t.name)],
);

export const cities = pgTable(
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
    featureCode: varchar("feature_code", { length: 10 }),
  },
  (t) => [
    index("IDX_cities_country_code").on(t.countryCode),
    index("IDX_cities_population").on(t.population),
    index("IDX_cities_name").on(t.name),
    index("IDX_cities_ascii_name").on(t.asciiName),
  ],
);

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Places table (restaurants, hotels, attractions)
export const places = pgTable("places", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // restaurant, hotel, attraction
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website"),
  priceRange: varchar("price_range", { length: 10 }), // $, $$, $$$, $$$$
  cuisine: varchar("cuisine", { length: 50 }), // for restaurants
  amenities: text("amenities").array(), // for hotels
  imageUrl: varchar("image_url"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  content: text("content"),
  images: text("images").array(),
  isHelpful: integer("is_helpful").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel companions/trips table
export const trips = pgTable("trips", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip participants table
export const tripParticipants = pgTable("trip_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, rejected
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Trip waypoints (stops/places in a trip route)
export const tripWaypoints = pgTable("trip_waypoints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  dayNumber: integer("day_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // festival, food, music, etc.
  location: varchar("location", { length: 255 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  price: integer("price"), // in cents
  imageUrl: varchar("image_url"),
  organizerId: varchar("organizer_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event registrations (RSVP)
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  chatRoom: varchar("chat_room", { length: 100 }).notNull(), // e.g., "general", "rome", "paris"
  createdAt: timestamp("created_at").defaultNow(),
});

// User favorites table
export const userFavorites = pgTable("user_favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  placeId: uuid("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friends/Connections table
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User follows table
export const userFollows = pgTable("user_follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Private messages table
export const privateMessages = pgTable("private_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel posts/journal entries
export const travelPosts = pgTable("travel_posts", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post likes table
export const postLikes = pgTable("post_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => travelPosts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post comments table
export const postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => travelPosts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profile extensions
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  website: varchar("website"),
  travelStyle: varchar("travel_style", { length: 100 }), // adventurous, cultural, relaxation, etc.
  favoriteDestinations: text("favorite_destinations").array(),
  languages: text("languages").array(),
  interests: text("interests").array(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
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
  postComments: many(postComments),
}));

export const placesRelations = relations(places, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(userFavorites),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  place: one(places, { fields: [reviews.placeId], references: [places.id] }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  participants: many(tripParticipants),
  waypoints: many(tripWaypoints),
}));

export const tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
  trip: one(trips, { fields: [tripParticipants.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripParticipants.userId], references: [users.id] }),
}));

export const tripWaypointsRelations = relations(tripWaypoints, ({ one }) => ({
  trip: one(trips, { fields: [tripWaypoints.tripId], references: [trips.id] }),
  place: one(places, { fields: [tripWaypoints.placeId], references: [places.id] }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, { fields: [userFavorites.userId], references: [users.id] }),
  place: one(places, { fields: [userFavorites.placeId], references: [places.id] }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, { fields: [friendships.requesterId], references: [users.id], relationName: "requester" }),
  addressee: one(users, { fields: [friendships.addresseeId], references: [users.id], relationName: "addressee" }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, { fields: [userFollows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [userFollows.followingId], references: [users.id], relationName: "following" }),
}));

export const privateMessagesRelations = relations(privateMessages, ({ one }) => ({
  sender: one(users, { fields: [privateMessages.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [privateMessages.receiverId], references: [users.id], relationName: "receiver" }),
}));

export const travelPostsRelations = relations(travelPosts, ({ one, many }) => ({
  user: one(users, { fields: [travelPosts.userId], references: [users.id] }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
  post: one(travelPosts, { fields: [postLikes.postId], references: [travelPosts.id] }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  user: one(users, { fields: [postComments.userId], references: [users.id] }),
  post: one(travelPosts, { fields: [postComments.postId], references: [travelPosts.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

// Insert schemas
export const insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  currentParticipants: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripWaypointSchema = createInsertSchema(tripWaypoints).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export const insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({
  id: true,
  createdAt: true,
});

export const insertTravelPostSchema = createInsertSchema(travelPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type TripParticipant = typeof tripParticipants.$inferSelect;
export type TripWaypoint = typeof tripWaypoints.$inferSelect;
export type InsertTripWaypoint = z.infer<typeof insertTripWaypointSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;

// API Response Types
export interface PlaceWithDetails extends Place {
  averageRating: string;
  reviewCount: number;
  isFavorite?: boolean;
}

export interface FavoriteStatus {
  isFavorite: boolean;
}

export interface TravelPostWithAuthor extends TravelPost {
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'> | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface FriendshipWithUser extends Friendship {
  user: User | null;
}

export interface TripWaypointWithPlace extends TripWaypoint {
  place: Place | null;
}

export interface UserFavoriteWithPlace extends UserFavorite {
  place: Place | null;
}

export interface ReviewWithPlace extends Review {
  place: Place | null;
}
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;
export type TravelPost = typeof travelPosts.$inferSelect;
export type InsertTravelPost = z.infer<typeof insertTravelPostSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;

export type Country = typeof countries.$inferSelect;
export type City = typeof cities.$inferSelect;
