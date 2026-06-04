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
  username: varchar("username", { length: 30 }).unique(),
  displayName: varchar("display_name", { length: 64 }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  isVerified: boolean("is_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
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
  imageUrl: varchar("image_url"),
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
  updatedAt: timestamp("updated_at"),
});

export const chatMessageLikes = pgTable(
  "chat_message_likes",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("IDX_chat_message_likes_msg").on(t.messageId)],
);

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
  direction: varchar("direction", { length: 32 }), // travel direction tag when accepted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy settings (1:1 with user)
export const userPrivacySettings = pgTable("user_privacy_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  isPrivateAccount: boolean("is_private_account").default(false).notNull(),
  showOnlineStatus: varchar("show_online_status", { length: 20 }).default("friends").notNull(),
  showLastSeen: boolean("show_last_seen").default(true).notNull(),
  allowDmFrom: varchar("allow_dm_from", { length: 20 }).default("friends").notNull(),
  allowFriendRequestsFrom: varchar("allow_friend_requests_from", { length: 20 }).default("everyone").notNull(),
  showProfileTo: varchar("show_profile_to", { length: 20 }).default("everyone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Online presence
export const userPresence = pgTable("user_presence", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  isOnline: boolean("is_online").default(false).notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
});

// Chat rooms (supergroups)
export const chatRooms = pgTable(
  "chat_rooms",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    avatarUrl: varchar("avatar_url"),
    visibility: varchar("visibility", { length: 20 }).default("public").notNull(), // public | private
    createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
    settings: jsonb("settings").$type<{
      slowModeSeconds?: number;
      whoCanInvite?: "everyone" | "admins";
      whoCanPost?: "everyone" | "members";
      autoJoinOnPost?: boolean;
      chatBackground?: string;
    }>(),
    isLegacy: boolean("is_legacy").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("IDX_chat_rooms_visibility").on(t.visibility)],
);

export const chatRoomMembers = pgTable(
  "chat_room_members",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("member").notNull(), // owner | admin | member
    status: varchar("status", { length: 20 }).default("active").notNull(), // active | banned
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => [
    index("IDX_chat_room_members_room").on(t.roomId),
    index("IDX_chat_room_members_user").on(t.userId),
  ],
);

export const chatRoomInvites = pgTable("chat_room_invites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatPinnedMessages = pgTable("chat_pinned_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  pinnedBy: varchar("pinned_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  pinnedAt: timestamp("pinned_at").defaultNow(),
});

// In-app notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    link: varchar("link", { length: 500 }),
    actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
    entityId: varchar("entity_id", { length: 100 }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("IDX_notifications_user").on(t.userId),
    index("IDX_notifications_user_unread").on(t.userId, t.isRead),
  ],
);

// Web Push subscriptions (per device)
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("IDX_push_subscriptions_user").on(t.userId)],
);

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
  updatedAt: timestamp("updated_at"),
});

export const privateMessageLikes = pgTable(
  "private_message_likes",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => privateMessages.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("IDX_private_message_likes_msg").on(t.messageId)],
);

// Travel posts — format: post | story | reel | journal
export const travelPosts = pgTable("travel_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  format: varchar("format", { length: 16 }).notNull().default("post"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  images: text("images").array(),
  location: varchar("location", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(true),
  expiresAt: timestamp("expires_at"),
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

// User-uploaded music tracks (personal library)
export const userTracks = pgTable(
  "user_tracks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    fileUrl: varchar("file_url", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 50 }),
    fileSizeBytes: integer("file_size_bytes"),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("IDX_user_tracks_user").on(t.userId)],
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  reviews: many(reviews),
  trips: many(trips),
  tripParticipants: many(tripParticipants),
  chatMessages: many(chatMessages),
  favorites: many(userFavorites),
  profile: one(userProfiles),
  privacySettings: one(userPrivacySettings),
  presence: one(userPresence),
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
  followers: many(userFollows, { relationName: "following" }),
  following: many(userFollows, { relationName: "follower" }),
  sentMessages: many(privateMessages, { relationName: "sender" }),
  receivedMessages: many(privateMessages, { relationName: "receiver" }),
  travelPosts: many(travelPosts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  tracks: many(userTracks),
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

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  creator: one(users, { fields: [chatRooms.createdBy], references: [users.id] }),
  members: many(chatRoomMembers),
  invites: many(chatRoomInvites),
}));

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, { fields: [chatRoomMembers.roomId], references: [chatRooms.id] }),
  user: one(users, { fields: [chatRoomMembers.userId], references: [users.id] }),
}));

export const userPrivacySettingsRelations = relations(userPrivacySettings, ({ one }) => ({
  user: one(users, { fields: [userPrivacySettings.userId], references: [users.id] }),
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

export const userTracksRelations = relations(userTracks, ({ one }) => ({
  user: one(users, { fields: [userTracks.userId], references: [users.id] }),
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
  updatedAt: true,
});

export const updateChatMessageSchema = z.object({
  content: z.string().min(1).max(8000),
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
  updatedAt: true,
});

export const updatePrivateMessageSchema = z.object({
  content: z.string().min(1).max(8000),
});

export const insertTravelPostSchema = createInsertSchema(travelPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Allowed fields for PUT /api/posts/:id (no userId / timestamps). */
export const updateTravelPostSchema = z
  .object({
    title: z.string().max(255).optional(),
    content: z.string().optional(),
    images: z.array(z.string()).optional(),
    location: z.string().max(255).nullable().optional(),
    latitude: z.string().nullable().optional(),
    longitude: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    format: z.enum(["post", "story", "reel", "journal"]).optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  })
  .strict();

/** Allowed fields for PUT /api/profile (no userId / id). */
export const updateUserProfileSchema = z
  .object({
    bio: z.string().nullable().optional(),
    location: z.string().max(255).nullable().optional(),
    website: z.string().max(500).nullable().optional(),
    travelStyle: z.string().max(100).nullable().optional(),
    favoriteDestinations: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict();

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTrackSchema = createInsertSchema(userTracks).omit({
  id: true,
  createdAt: true,
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

/** Enriched on list endpoints */
export type MessageReactionMeta = {
  likeCount: number;
  likedByMe: boolean;
};

export type ChatMessageWithMeta = ChatMessage & MessageReactionMeta;
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
export type PrivateMessageWithMeta = PrivateMessage & MessageReactionMeta;
export type TravelPost = typeof travelPosts.$inferSelect;
export type InsertTravelPost = z.infer<typeof insertTravelPostSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type UserTrack = typeof userTracks.$inferSelect;
export type InsertUserTrack = z.infer<typeof insertUserTrackSchema>;

export type Country = typeof countries.$inferSelect;
export type City = typeof cities.$inferSelect;
export type UserPrivacySettingsRow = typeof userPrivacySettings.$inferSelect;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type ChatRoomInvite = typeof chatRoomInvites.$inferSelect;
export type UserPresence = typeof userPresence.$inferSelect;

export type ChatRoomWithMeta = ChatRoom & {
  memberCount?: number;
  myRole?: string | null;
  isMember?: boolean;
};
export type NotificationRow = typeof notifications.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
