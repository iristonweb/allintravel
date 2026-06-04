var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/privacy.ts
import { z } from "zod";
var privacyAudienceSchema, DEFAULT_PRIVACY_SETTINGS, updatePrivacySettingsSchema;
var init_privacy = __esm({
  "shared/privacy.ts"() {
    "use strict";
    privacyAudienceSchema = z.enum(["everyone", "friends", "nobody"]);
    DEFAULT_PRIVACY_SETTINGS = {
      isPrivateAccount: false,
      showOnlineStatus: "friends",
      showLastSeen: true,
      allowDmFrom: "friends",
      allowFriendRequestsFrom: "everyone",
      showProfileTo: "everyone"
    };
    updatePrivacySettingsSchema = z.object({
      isPrivateAccount: z.boolean().optional(),
      showOnlineStatus: privacyAudienceSchema.optional(),
      showLastSeen: z.boolean().optional(),
      allowDmFrom: privacyAudienceSchema.optional(),
      allowFriendRequestsFrom: privacyAudienceSchema.optional(),
      showProfileTo: privacyAudienceSchema.optional()
    }).strict();
  }
});

// server/legacy-chat-rooms.ts
var LEGACY_CHAT_ROOM_SEEDS;
var init_legacy_chat_rooms = __esm({
  "server/legacy-chat-rooms.ts"() {
    "use strict";
    LEGACY_CHAT_ROOM_SEEDS = [
      { slug: "general", title: "\u041E\u0431\u0449\u0438\u0439", description: "\u041E\u0431\u0449\u0438\u0439 \u0447\u0430\u0442 \u043F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u0438\u043A\u043E\u0432" },
      { slug: "europe", title: "\u0415\u0432\u0440\u043E\u043F\u0430", description: "\u041E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u043E\u0435\u0437\u0434\u043E\u043A \u043F\u043E \u0415\u0432\u0440\u043E\u043F\u0435" },
      { slug: "asia", title: "\u0410\u0437\u0438\u044F", description: "\u041E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u043E\u0435\u0437\u0434\u043E\u043A \u043F\u043E \u0410\u0437\u0438\u0438" },
      { slug: "america", title: "\u0410\u043C\u0435\u0440\u0438\u043A\u0430", description: "\u041E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u043E\u0435\u0437\u0434\u043E\u043A \u043F\u043E \u0410\u043C\u0435\u0440\u0438\u043A\u0435" },
      { slug: "tips", title: "\u0421\u043E\u0432\u0435\u0442\u044B", description: "\u0421\u043E\u0432\u0435\u0442\u044B \u0438 \u043B\u0430\u0439\u0444\u0445\u0430\u043A\u0438 \u0434\u043B\u044F \u043F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0439" },
      { slug: "iceland-2024", title: "\u0418\u0441\u043B\u0430\u043D\u0434\u0438\u044F 2024", description: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043F\u043E\u0435\u0437\u0434\u043A\u0438 \u0432 \u0418\u0441\u043B\u0430\u043D\u0434\u0438\u044E" }
    ];
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminBroadcastDismissals: () => adminBroadcastDismissals,
  adminBroadcasts: () => adminBroadcasts,
  chatMessageLikes: () => chatMessageLikes,
  chatMessageReactions: () => chatMessageReactions,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  chatPinnedMessages: () => chatPinnedMessages,
  chatRoomInvites: () => chatRoomInvites,
  chatRoomMembers: () => chatRoomMembers,
  chatRoomMembersRelations: () => chatRoomMembersRelations,
  chatRoomReadCursors: () => chatRoomReadCursors,
  chatRooms: () => chatRooms,
  chatRoomsRelations: () => chatRoomsRelations,
  cities: () => cities,
  countries: () => countries,
  eventRegistrations: () => eventRegistrations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  friendships: () => friendships,
  friendshipsRelations: () => friendshipsRelations,
  insertAdminBroadcastSchema: () => insertAdminBroadcastSchema,
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
  insertUserTrackSchema: () => insertUserTrackSchema,
  notifications: () => notifications,
  places: () => places,
  placesRelations: () => placesRelations,
  postComments: () => postComments,
  postCommentsRelations: () => postCommentsRelations,
  postLikes: () => postLikes,
  postLikesRelations: () => postLikesRelations,
  privateMessageLikes: () => privateMessageLikes,
  privateMessageReactions: () => privateMessageReactions,
  privateMessages: () => privateMessages,
  privateMessagesRelations: () => privateMessagesRelations,
  pushSubscriptions: () => pushSubscriptions,
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
  updateChatMessageSchema: () => updateChatMessageSchema,
  updatePrivateMessageSchema: () => updatePrivateMessageSchema,
  updateTravelPostSchema: () => updateTravelPostSchema,
  updateUserProfileSchema: () => updateUserProfileSchema,
  userFavorites: () => userFavorites,
  userFavoritesRelations: () => userFavoritesRelations,
  userFollows: () => userFollows,
  userFollowsRelations: () => userFollowsRelations,
  userPresence: () => userPresence,
  userPrivacySettings: () => userPrivacySettings,
  userPrivacySettingsRelations: () => userPrivacySettingsRelations,
  userProfiles: () => userProfiles,
  userProfilesRelations: () => userProfilesRelations,
  userTracks: () => userTracks,
  userTracksRelations: () => userTracksRelations,
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
  uuid,
  primaryKey,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z as z2 } from "zod";
var countries, cities, sessions, users, places, reviews, trips, tripParticipants, tripWaypoints, events, eventRegistrations, chatMessages, chatMessageLikes, chatMessageReactions, userFavorites, friendships, userPrivacySettings, userPresence, chatRooms, chatRoomMembers, chatRoomReadCursors, chatRoomInvites, chatPinnedMessages, notifications, pushSubscriptions, adminBroadcasts, adminBroadcastDismissals, userFollows, privateMessages, privateMessageLikes, privateMessageReactions, travelPosts, postLikes, postComments, userProfiles, userTracks, usersRelations, placesRelations, reviewsRelations, tripsRelations, tripParticipantsRelations, tripWaypointsRelations, eventsRelations, chatMessagesRelations, chatRoomsRelations, chatRoomMembersRelations, userPrivacySettingsRelations, userFavoritesRelations, friendshipsRelations, userFollowsRelations, privateMessagesRelations, travelPostsRelations, postLikesRelations, postCommentsRelations, userProfilesRelations, userTracksRelations, insertPlaceSchema, insertReviewSchema, insertTripSchema, insertTripWaypointSchema, insertEventSchema, insertChatMessageSchema, updateChatMessageSchema, insertUserProfileSchema, insertFriendshipSchema, insertUserFollowSchema, insertAdminBroadcastSchema, insertPrivateMessageSchema, updatePrivateMessageSchema, insertTravelPostSchema, updateTravelPostSchema, updateUserProfileSchema, insertPostLikeSchema, insertPostCommentSchema, insertUserTrackSchema;
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
      imageUrl: varchar("image_url"),
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
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at")
    });
    chatMessageLikes = pgTable(
      "chat_message_likes",
      {
        messageId: uuid("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [index("IDX_chat_message_likes_msg").on(t.messageId)]
    );
    chatMessageReactions = pgTable(
      "chat_message_reactions",
      {
        messageId: uuid("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        emoji: varchar("emoji", { length: 16 }).notNull(),
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [
        primaryKey({ columns: [t.messageId, t.userId] }),
        index("IDX_chat_message_reactions_msg").on(t.messageId)
      ]
    );
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
      direction: varchar("direction", { length: 32 }),
      // travel direction tag when accepted
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userPrivacySettings = pgTable("user_privacy_settings", {
      userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      isPrivateAccount: boolean("is_private_account").default(false).notNull(),
      showOnlineStatus: varchar("show_online_status", { length: 20 }).default("friends").notNull(),
      showLastSeen: boolean("show_last_seen").default(true).notNull(),
      allowDmFrom: varchar("allow_dm_from", { length: 20 }).default("friends").notNull(),
      allowFriendRequestsFrom: varchar("allow_friend_requests_from", { length: 20 }).default("everyone").notNull(),
      showProfileTo: varchar("show_profile_to", { length: 20 }).default("everyone").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userPresence = pgTable("user_presence", {
      userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      isOnline: boolean("is_online").default(false).notNull(),
      lastSeenAt: timestamp("last_seen_at").defaultNow()
    });
    chatRooms = pgTable(
      "chat_rooms",
      {
        id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
        slug: varchar("slug", { length: 100 }).notNull().unique(),
        title: varchar("title", { length: 120 }).notNull(),
        description: text("description"),
        avatarUrl: varchar("avatar_url"),
        visibility: varchar("visibility", { length: 20 }).default("public").notNull(),
        // public | private
        createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
        settings: jsonb("settings").$type(),
        isLegacy: boolean("is_legacy").default(false),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow()
      },
      (t) => [index("IDX_chat_rooms_visibility").on(t.visibility)]
    );
    chatRoomMembers = pgTable(
      "chat_room_members",
      {
        id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
        roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 20 }).default("member").notNull(),
        // owner | admin | member
        status: varchar("status", { length: 20 }).default("active").notNull(),
        // active | banned
        joinedAt: timestamp("joined_at").defaultNow()
      },
      (t) => [
        index("IDX_chat_room_members_room").on(t.roomId),
        index("IDX_chat_room_members_user").on(t.userId)
      ]
    );
    chatRoomReadCursors = pgTable(
      "chat_room_read_cursors",
      {
        roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        lastReadMessageId: uuid("last_read_message_id").references(() => chatMessages.id, {
          onDelete: "set null"
        }),
        updatedAt: timestamp("updated_at").defaultNow()
      },
      (t) => [primaryKey({ columns: [t.roomId, t.userId] })]
    );
    chatRoomInvites = pgTable("chat_room_invites", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
      token: varchar("token", { length: 64 }).notNull().unique(),
      createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      expiresAt: timestamp("expires_at"),
      maxUses: integer("max_uses"),
      useCount: integer("use_count").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    chatPinnedMessages = pgTable("chat_pinned_messages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
      messageId: uuid("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
      pinnedBy: varchar("pinned_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      pinnedAt: timestamp("pinned_at").defaultNow()
    });
    notifications = pgTable(
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
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [
        index("IDX_notifications_user").on(t.userId),
        index("IDX_notifications_user_unread").on(t.userId, t.isRead)
      ]
    );
    pushSubscriptions = pgTable(
      "push_subscriptions",
      {
        id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        endpoint: text("endpoint").notNull().unique(),
        p256dh: text("p256dh").notNull(),
        auth: text("auth").notNull(),
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [index("IDX_push_subscriptions_user").on(t.userId)]
    );
    adminBroadcasts = pgTable("admin_broadcasts", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    adminBroadcastDismissals = pgTable(
      "admin_broadcast_dismissals",
      {
        id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
        broadcastId: uuid("broadcast_id").notNull().references(() => adminBroadcasts.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        action: varchar("action", { length: 20 }).notNull(),
        dismissedAt: timestamp("dismissed_at").defaultNow()
      },
      (t) => [uniqueIndex("IDX_broadcast_dismissal_user").on(t.broadcastId, t.userId)]
    );
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
      deliveredAt: timestamp("delivered_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at")
    });
    privateMessageLikes = pgTable(
      "private_message_likes",
      {
        messageId: uuid("message_id").notNull().references(() => privateMessages.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [index("IDX_private_message_likes_msg").on(t.messageId)]
    );
    privateMessageReactions = pgTable(
      "private_message_reactions",
      {
        messageId: uuid("message_id").notNull().references(() => privateMessages.id, { onDelete: "cascade" }),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        emoji: varchar("emoji", { length: 16 }).notNull(),
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [
        primaryKey({ columns: [t.messageId, t.userId] }),
        index("IDX_private_message_reactions_msg").on(t.messageId)
      ]
    );
    travelPosts = pgTable("travel_posts", {
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
    userTracks = pgTable(
      "user_tracks",
      {
        id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 200 }).notNull(),
        fileUrl: varchar("file_url", { length: 500 }).notNull(),
        mimeType: varchar("mime_type", { length: 50 }),
        fileSizeBytes: integer("file_size_bytes"),
        durationSeconds: integer("duration_seconds"),
        artist: varchar("artist", { length: 200 }),
        sourceProvider: varchar("source_provider", { length: 50 }),
        sourceId: varchar("source_id", { length: 100 }),
        license: varchar("license", { length: 100 }),
        isPreview: boolean("is_preview").default(false),
        createdAt: timestamp("created_at").defaultNow()
      },
      (t) => [index("IDX_user_tracks_user").on(t.userId)]
    );
    usersRelations = relations(users, ({ one, many }) => ({
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
      tracks: many(userTracks)
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
    chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
      creator: one(users, { fields: [chatRooms.createdBy], references: [users.id] }),
      members: many(chatRoomMembers),
      invites: many(chatRoomInvites)
    }));
    chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
      room: one(chatRooms, { fields: [chatRoomMembers.roomId], references: [chatRooms.id] }),
      user: one(users, { fields: [chatRoomMembers.userId], references: [users.id] })
    }));
    userPrivacySettingsRelations = relations(userPrivacySettings, ({ one }) => ({
      user: one(users, { fields: [userPrivacySettings.userId], references: [users.id] })
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
    userTracksRelations = relations(userTracks, ({ one }) => ({
      user: one(users, { fields: [userTracks.userId], references: [users.id] })
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
      createdAt: true,
      updatedAt: true
    });
    updateChatMessageSchema = z2.object({
      content: z2.string().min(1).max(8e3)
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
    insertAdminBroadcastSchema = createInsertSchema(adminBroadcasts).omit({
      id: true,
      createdAt: true
    });
    insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updatePrivateMessageSchema = z2.object({
      content: z2.string().min(1).max(8e3)
    });
    insertTravelPostSchema = createInsertSchema(travelPosts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateTravelPostSchema = z2.object({
      title: z2.string().max(255).optional(),
      content: z2.string().optional(),
      images: z2.array(z2.string()).optional(),
      location: z2.string().max(255).nullable().optional(),
      latitude: z2.string().nullable().optional(),
      longitude: z2.string().nullable().optional(),
      tags: z2.array(z2.string()).optional(),
      isPublic: z2.boolean().optional(),
      format: z2.enum(["post", "story", "reel", "journal"]).optional(),
      expiresAt: z2.coerce.date().nullable().optional()
    }).strict();
    updateUserProfileSchema = z2.object({
      bio: z2.string().nullable().optional(),
      location: z2.string().max(255).nullable().optional(),
      website: z2.string().max(500).nullable().optional(),
      travelStyle: z2.string().max(100).nullable().optional(),
      favoriteDestinations: z2.array(z2.string()).optional(),
      languages: z2.array(z2.string()).optional(),
      interests: z2.array(z2.string()).optional(),
      isPublic: z2.boolean().optional()
    }).strict();
    insertPostLikeSchema = createInsertSchema(postLikes).omit({
      id: true,
      createdAt: true
    });
    insertPostCommentSchema = createInsertSchema(postComments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserTrackSchema = createInsertSchema(userTracks).omit({
      id: true,
      createdAt: true
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
  return getPool();
}
function isDatabaseConfigured() {
  return Boolean(databaseUrl());
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
var poolInstance, dbInstance, db, pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    poolInstance = null;
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

// server/seed-data.ts
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
var DEMO_USER_ID, SEED_PLACE_IDS;
var init_seed_data = __esm({
  "server/seed-data.ts"() {
    "use strict";
    DEMO_USER_ID = "00000000-0000-4000-a000-000000000001";
    SEED_PLACE_IDS = {
      santorini: "11111111-1111-4111-a111-111111111101",
      kyoto: "11111111-1111-4111-a111-111111111102",
      machuPicchu: "11111111-1111-4111-a111-111111111103",
      amalfi: "11111111-1111-4111-a111-111111111104",
      iceland: "11111111-1111-4111-a111-111111111105",
      louvre: "11111111-1111-4111-a111-111111111106"
    };
  }
});

// server/admin.ts
var admin_exports = {};
__export(admin_exports, {
  getAdminEmails: () => getAdminEmails,
  resolveIsAdmin: () => resolveIsAdmin
});
function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
}
function resolveIsAdmin(email) {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}
var init_admin = __esm({
  "server/admin.ts"() {
    "use strict";
  }
});

// server/privacy-helpers.ts
function rowToPrivacySettings(row) {
  return {
    userId: row.userId,
    isPrivateAccount: row.isPrivateAccount,
    showOnlineStatus: row.showOnlineStatus,
    showLastSeen: row.showLastSeen,
    allowDmFrom: row.allowDmFrom,
    allowFriendRequestsFrom: row.allowFriendRequestsFrom,
    showProfileTo: row.showProfileTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
function defaultPrivacyRow(userId) {
  return { userId, ...DEFAULT_PRIVACY_SETTINGS, createdAt: null, updatedAt: null };
}
function audienceAllows(audience, opts) {
  if (opts.isSelf) return true;
  if (audience === "everyone") return true;
  if (audience === "friends") return opts.isFriend;
  return false;
}
function canViewProfile(settings, viewerId, targetId, isFriend) {
  if (!viewerId) {
    if (settings.isPrivateAccount) return false;
    return audienceAllows(settings.showProfileTo, { isSelf: false, isFriend: false });
  }
  if (viewerId === targetId) return true;
  if (settings.isPrivateAccount && !isFriend) return false;
  return audienceAllows(settings.showProfileTo, { isSelf: false, isFriend });
}
function canSendDm(settings, senderId, targetId, isFriend) {
  if (senderId === targetId) return false;
  return audienceAllows(settings.allowDmFrom, { isSelf: false, isFriend });
}
function canSendFriendRequest(settings, requesterId, targetId, isFriend) {
  if (requesterId === targetId) return false;
  return audienceAllows(settings.allowFriendRequestsFrom, { isSelf: false, isFriend });
}
function canSeeOnlineStatus(settings, viewerId, targetId, isFriend) {
  if (!viewerId) return false;
  if (viewerId === targetId) return true;
  if (!settings.showLastSeen) return false;
  return audienceAllows(settings.showOnlineStatus, { isSelf: false, isFriend });
}
var init_privacy_helpers = __esm({
  "server/privacy-helpers.ts"() {
    "use strict";
    init_privacy();
  }
});

// server/notification-storage.ts
var notification_storage_exports = {};
__export(notification_storage_exports, {
  createNotificationDb: () => createNotificationDb,
  deletePushSubscriptionDb: () => deletePushSubscriptionDb,
  ensureNotificationSchema: () => ensureNotificationSchema,
  getNotificationsDb: () => getNotificationsDb,
  getPushSubscriptionsForUserDb: () => getPushSubscriptionsForUserDb,
  getUnreadNotificationCountDb: () => getUnreadNotificationCountDb,
  markAllNotificationsReadDb: () => markAllNotificationsReadDb,
  markNotificationReadDb: () => markNotificationReadDb,
  upsertPushSubscriptionDb: () => upsertPushSubscriptionDb
});
import { and, count, desc, eq, sql as sql2 } from "drizzle-orm";
async function ensureNotificationSchema(db2) {
  await db2.execute(sql2`
    CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type varchar(40) NOT NULL,
      title varchar(200) NOT NULL,
      body text NOT NULL,
      link varchar(500),
      actor_id varchar REFERENCES users(id) ON DELETE SET NULL,
      entity_id varchar(100),
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql2`CREATE INDEX IF NOT EXISTS IDX_notifications_user ON notifications (user_id)`);
  await db2.execute(
    sql2`CREATE INDEX IF NOT EXISTS IDX_notifications_user_unread ON notifications (user_id, is_read)`
  );
  await db2.execute(sql2`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint text NOT NULL UNIQUE,
      p256dh text NOT NULL,
      auth text NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(
    sql2`CREATE INDEX IF NOT EXISTS IDX_push_subscriptions_user ON push_subscriptions (user_id)`
  );
}
async function createNotificationDb(db2, data) {
  const [row] = await db2.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    body: data.body,
    link: data.link ?? null,
    actorId: data.actorId ?? null,
    entityId: data.entityId ?? null,
    isRead: false
  }).returning();
  return row;
}
async function getNotificationsDb(db2, userId, limit = 50) {
  return db2.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function getUnreadNotificationCountDb(db2, userId) {
  const [{ value }] = await db2.select({ value: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(value);
}
async function markNotificationReadDb(db2, userId, id) {
  await db2.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}
async function markAllNotificationsReadDb(db2, userId) {
  await db2.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}
async function upsertPushSubscriptionDb(db2, userId, sub) {
  await db2.insert(pushSubscriptions).values({
    userId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth
  }).onConflictDoUpdate({
    target: pushSubscriptions.endpoint,
    set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth }
  });
}
async function getPushSubscriptionsForUserDb(db2, userId) {
  const rows = await db2.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  return rows.map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
}
async function deletePushSubscriptionDb(db2, endpoint) {
  await db2.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
var init_notification_storage = __esm({
  "server/notification-storage.ts"() {
    "use strict";
    init_schema();
  }
});

// server/pg-storage-features.ts
import { and as and2, count as count2, desc as desc2, eq as eq2, ilike, inArray, or, sql as sql3 } from "drizzle-orm";
function slugify(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return base || "room";
}
async function ensureExtendedSchema(db2) {
  await ensureNotificationSchema(db2);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS user_privacy_settings (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      is_private_account boolean NOT NULL DEFAULT false,
      show_online_status varchar(20) NOT NULL DEFAULT 'friends',
      show_last_seen boolean NOT NULL DEFAULT true,
      allow_dm_from varchar(20) NOT NULL DEFAULT 'friends',
      allow_friend_requests_from varchar(20) NOT NULL DEFAULT 'everyone',
      show_profile_to varchar(20) NOT NULL DEFAULT 'everyone',
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      is_online boolean NOT NULL DEFAULT false,
      last_seen_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`ALTER TABLE friendships ADD COLUMN IF NOT EXISTS direction varchar(32)`);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug varchar(100) NOT NULL UNIQUE,
      title varchar(120) NOT NULL,
      description text,
      avatar_url varchar,
      visibility varchar(20) NOT NULL DEFAULT 'public',
      created_by varchar REFERENCES users(id) ON DELETE SET NULL,
      settings jsonb,
      is_legacy boolean DEFAULT false,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_room_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role varchar(20) NOT NULL DEFAULT 'member',
      status varchar(20) NOT NULL DEFAULT 'active',
      joined_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_room_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      token varchar(64) NOT NULL UNIQUE,
      created_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamp,
      max_uses integer,
      use_count integer DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_pinned_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      pinned_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pinned_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS updated_at timestamp`);
  await db2.execute(sql3`ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS updated_at timestamp`);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_message_likes (
      message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS private_message_likes (
      message_id uuid NOT NULL REFERENCES private_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji varchar(16) NOT NULL,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS private_message_reactions (
      message_id uuid NOT NULL REFERENCES private_messages(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji varchar(16) NOT NULL,
      created_at timestamp DEFAULT now(),
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db2.execute(sql3`
    INSERT INTO chat_message_reactions (message_id, user_id, emoji, created_at)
    SELECT message_id, user_id, ${"\u2764\uFE0F"}, created_at FROM chat_message_likes
    ON CONFLICT (message_id, user_id) DO NOTHING
  `);
  await db2.execute(sql3`
    INSERT INTO private_message_reactions (message_id, user_id, emoji, created_at)
    SELECT message_id, user_id, ${"\u2764\uFE0F"}, created_at FROM private_message_likes
    ON CONFLICT (message_id, user_id) DO NOTHING
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS chat_room_read_cursors (
      room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
      updated_at timestamp DEFAULT now(),
      PRIMARY KEY (room_id, user_id)
    )
  `);
  await db2.execute(sql3`ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS delivered_at timestamp`);
  await db2.execute(sql3`ALTER TABLE trips ADD COLUMN IF NOT EXISTS image_url varchar(500)`);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS user_tracks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      file_url varchar(500) NOT NULL,
      mime_type varchar(50),
      file_size_bytes integer,
      duration_seconds integer,
      created_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`CREATE INDEX IF NOT EXISTS "IDX_user_tracks_user" ON user_tracks (user_id)`);
  await db2.execute(sql3`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS artist varchar(200)`);
  await db2.execute(sql3`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS source_provider varchar(50)`);
  await db2.execute(sql3`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS source_id varchar(100)`);
  await db2.execute(sql3`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS license varchar(100)`);
  await db2.execute(sql3`ALTER TABLE user_tracks ADD COLUMN IF NOT EXISTS is_preview boolean DEFAULT false`);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS admin_broadcasts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content text NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      expires_at timestamp,
      created_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`
    CREATE TABLE IF NOT EXISTS admin_broadcast_dismissals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      broadcast_id uuid NOT NULL REFERENCES admin_broadcasts(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action varchar(20) NOT NULL,
      dismissed_at timestamp DEFAULT now()
    )
  `);
  await db2.execute(sql3`
    CREATE UNIQUE INDEX IF NOT EXISTS IDX_broadcast_dismissal_user
    ON admin_broadcast_dismissals (broadcast_id, user_id)
  `);
}
async function getChatMessageDb(db2, messageId) {
  const [row] = await db2.select().from(chatMessages).where(eq2(chatMessages.id, messageId)).limit(1);
  return row;
}
async function updateChatMessageDb(db2, messageId, content) {
  const [row] = await db2.update(chatMessages).set({ content, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(chatMessages.id, messageId)).returning();
  return row;
}
async function getPrivateMessageDb(db2, messageId) {
  const [row] = await db2.select().from(privateMessages).where(eq2(privateMessages.id, messageId)).limit(1);
  return row;
}
async function updatePrivateMessageDb(db2, messageId, content) {
  const [row] = await db2.update(privateMessages).set({ content, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(privateMessages.id, messageId)).returning();
  return row;
}
async function deletePrivateMessageDb(db2, messageId) {
  await db2.delete(privateMessages).where(eq2(privateMessages.id, messageId));
}
async function likeMetaForIds(db2, table, messageIds, viewerId) {
  const out = {};
  if (messageIds.length === 0) return out;
  const counts = await db2.select({
    messageId: table.messageId,
    cnt: count2()
  }).from(table).where(inArray(table.messageId, messageIds)).groupBy(table.messageId);
  for (const id of messageIds) {
    out[id] = { likeCount: 0, likedByMe: false };
  }
  for (const row of counts) {
    out[row.messageId] = { likeCount: Number(row.cnt), likedByMe: false };
  }
  const mine = await db2.select({ messageId: table.messageId }).from(table).where(and2(inArray(table.messageId, messageIds), eq2(table.userId, viewerId)));
  for (const row of mine) {
    if (out[row.messageId]) out[row.messageId].likedByMe = true;
  }
  return out;
}
async function getChatMessageLikeMetaDb(db2, messageIds, viewerId) {
  return likeMetaForIds(db2, chatMessageLikes, messageIds, viewerId);
}
async function getPrivateMessageLikeMetaDb(db2, messageIds, viewerId) {
  return likeMetaForIds(db2, privateMessageLikes, messageIds, viewerId);
}
async function toggleChatMessageLikeDb(db2, messageId, userId) {
  const [existing] = await db2.select().from(chatMessageLikes).where(and2(eq2(chatMessageLikes.messageId, messageId), eq2(chatMessageLikes.userId, userId))).limit(1);
  if (existing) {
    await db2.delete(chatMessageLikes).where(and2(eq2(chatMessageLikes.messageId, messageId), eq2(chatMessageLikes.userId, userId)));
  } else {
    await db2.insert(chatMessageLikes).values({ messageId, userId });
  }
  const meta = await getChatMessageLikeMetaDb(db2, [messageId], userId);
  return meta[messageId] ?? { likeCount: 0, likedByMe: false };
}
async function togglePrivateMessageLikeDb(db2, messageId, userId) {
  const [existing] = await db2.select().from(privateMessageLikes).where(and2(eq2(privateMessageLikes.messageId, messageId), eq2(privateMessageLikes.userId, userId))).limit(1);
  if (existing) {
    await db2.delete(privateMessageLikes).where(and2(eq2(privateMessageLikes.messageId, messageId), eq2(privateMessageLikes.userId, userId)));
  } else {
    await db2.insert(privateMessageLikes).values({ messageId, userId });
  }
  const meta = await getPrivateMessageLikeMetaDb(db2, [messageId], userId);
  return meta[messageId] ?? { likeCount: 0, likedByMe: false };
}
async function reactionsMetaForIds(db2, table, messageIds, viewerId) {
  const out = {};
  if (messageIds.length === 0) return out;
  for (const id of messageIds) out[id] = { reactions: [] };
  const rows = await db2.select({
    messageId: table.messageId,
    emoji: table.emoji,
    userId: table.userId
  }).from(table).where(inArray(table.messageId, messageIds));
  const grouped = /* @__PURE__ */ new Map();
  for (const id of messageIds) grouped.set(id, /* @__PURE__ */ new Map());
  for (const row of rows) {
    const byEmoji = grouped.get(row.messageId);
    const existing = byEmoji.get(row.emoji) ?? { count: 0, reactedByMe: false };
    existing.count += 1;
    if (row.userId === viewerId) existing.reactedByMe = true;
    byEmoji.set(row.emoji, existing);
  }
  for (const [messageId, byEmoji] of Array.from(grouped.entries())) {
    out[messageId] = {
      reactions: Array.from(byEmoji.entries()).map(([emoji, v]) => ({ emoji, count: v.count, reactedByMe: v.reactedByMe })).sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji))
    };
  }
  return out;
}
async function getChatMessageReactionsMetaDb(db2, messageIds, viewerId) {
  return reactionsMetaForIds(db2, chatMessageReactions, messageIds, viewerId);
}
async function getPrivateMessageReactionsMetaDb(db2, messageIds, viewerId) {
  return reactionsMetaForIds(db2, privateMessageReactions, messageIds, viewerId);
}
async function setChatMessageReactionDb(db2, messageId, userId, emoji) {
  if (!emoji) {
    await db2.delete(chatMessageReactions).where(and2(eq2(chatMessageReactions.messageId, messageId), eq2(chatMessageReactions.userId, userId)));
  } else {
    await db2.insert(chatMessageReactions).values({ messageId, userId, emoji }).onConflictDoUpdate({
      target: [chatMessageReactions.messageId, chatMessageReactions.userId],
      set: { emoji, createdAt: /* @__PURE__ */ new Date() }
    });
  }
  const meta = await getChatMessageReactionsMetaDb(db2, [messageId], userId);
  return meta[messageId] ?? { reactions: [] };
}
async function setPrivateMessageReactionDb(db2, messageId, userId, emoji) {
  if (!emoji) {
    await db2.delete(privateMessageReactions).where(and2(eq2(privateMessageReactions.messageId, messageId), eq2(privateMessageReactions.userId, userId)));
  } else {
    await db2.insert(privateMessageReactions).values({ messageId, userId, emoji }).onConflictDoUpdate({
      target: [privateMessageReactions.messageId, privateMessageReactions.userId],
      set: { emoji, createdAt: /* @__PURE__ */ new Date() }
    });
  }
  const meta = await getPrivateMessageReactionsMetaDb(db2, [messageId], userId);
  return meta[messageId] ?? { reactions: [] };
}
async function getChatMessageReactionDetailsDb(db2, messageId) {
  const rows = await db2.select({
    emoji: chatMessageReactions.emoji,
    userId: chatMessageReactions.userId
  }).from(chatMessageReactions).where(eq2(chatMessageReactions.messageId, messageId));
  const byEmoji = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const list = byEmoji.get(row.emoji) ?? [];
    list.push(row.userId);
    byEmoji.set(row.emoji, list);
  }
  const result = [];
  for (const [emoji, userIds] of Array.from(byEmoji.entries())) {
    if (userIds.length === 0) continue;
    const userRows = await db2.select().from(users).where(inArray(users.id, userIds));
    result.push({ emoji, users: userRows });
  }
  return result.sort((a, b) => b.users.length - a.users.length || a.emoji.localeCompare(b.emoji));
}
async function getPrivateMessageReactionDetailsDb(db2, messageId) {
  const rows = await db2.select({
    emoji: privateMessageReactions.emoji,
    userId: privateMessageReactions.userId
  }).from(privateMessageReactions).where(eq2(privateMessageReactions.messageId, messageId));
  const byEmoji = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const list = byEmoji.get(row.emoji) ?? [];
    list.push(row.userId);
    byEmoji.set(row.emoji, list);
  }
  const result = [];
  for (const [emoji, userIds] of Array.from(byEmoji.entries())) {
    if (userIds.length === 0) continue;
    const userRows = await db2.select().from(users).where(inArray(users.id, userIds));
    result.push({ emoji, users: userRows });
  }
  return result.sort((a, b) => b.users.length - a.users.length || a.emoji.localeCompare(b.emoji));
}
async function upsertChatRoomReadCursorDb(db2, roomId, userId, lastReadMessageId) {
  await db2.insert(chatRoomReadCursors).values({ roomId, userId, lastReadMessageId, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({
    target: [chatRoomReadCursors.roomId, chatRoomReadCursors.userId],
    set: { lastReadMessageId, updatedAt: /* @__PURE__ */ new Date() }
  });
}
async function getChatRoomReadCursorsDb(db2, roomId) {
  return db2.select().from(chatRoomReadCursors).where(eq2(chatRoomReadCursors.roomId, roomId));
}
async function getChatMessageReadersDb(db2, roomId, messageId, excludeUserId) {
  const [msg] = await db2.select().from(chatMessages).where(eq2(chatMessages.id, messageId)).limit(1);
  if (!msg?.createdAt) return [];
  const cursors = await getChatRoomReadCursorsDb(db2, roomId);
  const readerIds = [];
  for (const cursor of cursors) {
    if (excludeUserId && cursor.userId === excludeUserId) continue;
    if (!cursor.lastReadMessageId) continue;
    const [readMsg] = await db2.select({ createdAt: chatMessages.createdAt }).from(chatMessages).where(eq2(chatMessages.id, cursor.lastReadMessageId)).limit(1);
    if (readMsg?.createdAt && new Date(readMsg.createdAt) >= new Date(msg.createdAt)) {
      readerIds.push(cursor.userId);
    }
  }
  if (readerIds.length === 0) return [];
  return db2.select().from(users).where(inArray(users.id, readerIds));
}
async function getChatMessageReadMetaDb(db2, roomId, messageIds, authorId) {
  const out = {};
  if (messageIds.length === 0) return out;
  const members = await db2.select({ userId: chatRoomMembers.userId }).from(chatRoomMembers).where(and2(eq2(chatRoomMembers.roomId, roomId), eq2(chatRoomMembers.status, "active")));
  const otherMemberIds = members.map((m) => m.userId).filter((id) => id !== authorId);
  const memberCount = otherMemberIds.length;
  const cursors = await getChatRoomReadCursorsDb(db2, roomId);
  const cursorByUser = new Map(cursors.map((c) => [c.userId, c]));
  const readMsgIds = cursors.map((c) => c.lastReadMessageId).filter(Boolean);
  const readMsgTimes = /* @__PURE__ */ new Map();
  if (readMsgIds.length > 0) {
    const readMsgs = await db2.select({ id: chatMessages.id, createdAt: chatMessages.createdAt }).from(chatMessages).where(inArray(chatMessages.id, readMsgIds));
    for (const m of readMsgs) {
      if (m.createdAt) readMsgTimes.set(m.id, new Date(m.createdAt));
    }
  }
  const msgs = await db2.select({ id: chatMessages.id, createdAt: chatMessages.createdAt }).from(chatMessages).where(inArray(chatMessages.id, messageIds));
  for (const msg of msgs) {
    if (!msg.createdAt) {
      out[msg.id] = { deliveryStatus: "sent", readByCount: 0, memberCount };
      continue;
    }
    const msgTime = new Date(msg.createdAt);
    let readByCount = 0;
    let deliveredCount = 0;
    for (const memberId of otherMemberIds) {
      const cursor = cursorByUser.get(memberId);
      if (!cursor) continue;
      deliveredCount += 1;
      const readTime = cursor.lastReadMessageId ? readMsgTimes.get(cursor.lastReadMessageId) : void 0;
      if (readTime && readTime >= msgTime) readByCount += 1;
    }
    let deliveryStatus = "sent";
    if (memberCount === 0) {
      deliveryStatus = "delivered";
    } else if (readByCount === memberCount) {
      deliveryStatus = "read";
    } else if (deliveredCount === memberCount || readByCount > 0) {
      deliveryStatus = "delivered";
    }
    out[msg.id] = { deliveryStatus, readByCount, memberCount };
  }
  return out;
}
async function markPrivateMessagesDeliveredDb(db2, receiverId, senderId) {
  await db2.update(privateMessages).set({ deliveredAt: /* @__PURE__ */ new Date() }).where(
    and2(
      eq2(privateMessages.receiverId, receiverId),
      eq2(privateMessages.senderId, senderId),
      sql3`${privateMessages.deliveredAt} IS NULL`
    )
  );
}
async function ensureLegacyChatRoomsDb(db2) {
  for (const seed of LEGACY_CHAT_ROOM_SEEDS) {
    const [existing] = await db2.select().from(chatRooms).where(eq2(chatRooms.slug, seed.slug)).limit(1);
    if (existing) continue;
    await db2.insert(chatRooms).values({
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      visibility: "public",
      isLegacy: true,
      settings: { autoJoinOnPost: true, whoCanPost: "everyone" }
    });
  }
}
async function getPrivacySettingsDb(db2, userId) {
  const [row] = await db2.select().from(userPrivacySettings).where(eq2(userPrivacySettings.userId, userId)).limit(1);
  if (row) return rowToPrivacySettings(row);
  const profile = await db2.select().from(userProfiles).where(eq2(userProfiles.userId, userId)).limit(1);
  const isPrivate = profile[0] ? !profile[0].isPublic : false;
  return {
    ...defaultPrivacyRow(userId),
    isPrivateAccount: isPrivate,
    showProfileTo: isPrivate ? "friends" : "everyone"
  };
}
async function updatePrivacySettingsDb(db2, userId, patch) {
  const current = await getPrivacySettingsDb(db2, userId);
  const merged = { ...current, ...patch };
  await db2.insert(userPrivacySettings).values({
    userId,
    isPrivateAccount: merged.isPrivateAccount,
    showOnlineStatus: merged.showOnlineStatus,
    showLastSeen: merged.showLastSeen,
    allowDmFrom: merged.allowDmFrom,
    allowFriendRequestsFrom: merged.allowFriendRequestsFrom,
    showProfileTo: merged.showProfileTo,
    updatedAt: /* @__PURE__ */ new Date()
  }).onConflictDoUpdate({
    target: userPrivacySettings.userId,
    set: {
      isPrivateAccount: merged.isPrivateAccount,
      showOnlineStatus: merged.showOnlineStatus,
      showLastSeen: merged.showLastSeen,
      allowDmFrom: merged.allowDmFrom,
      allowFriendRequestsFrom: merged.allowFriendRequestsFrom,
      showProfileTo: merged.showProfileTo,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  if (patch.isPrivateAccount !== void 0) {
    const prof = await db2.select().from(userProfiles).where(eq2(userProfiles.userId, userId)).limit(1);
    if (prof[0]) {
      await db2.update(userProfiles).set({ isPublic: !merged.isPrivateAccount, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(userProfiles.userId, userId));
    }
  }
  return getPrivacySettingsDb(db2, userId);
}
async function touchPresenceDb(db2, userId, isOnline) {
  const [row] = await db2.insert(userPresence).values({ userId, isOnline, lastSeenAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({
    target: userPresence.userId,
    set: { isOnline, lastSeenAt: /* @__PURE__ */ new Date() }
  }).returning();
  return row;
}
async function getPresenceDb(db2, userId) {
  const [row] = await db2.select().from(userPresence).where(eq2(userPresence.userId, userId)).limit(1);
  return row;
}
async function areFriendsDb(db2, userId1, userId2) {
  if (userId1 === userId2) return true;
  const [row] = await db2.select().from(friendships).where(
    and2(
      eq2(friendships.status, "accepted"),
      or(
        and2(eq2(friendships.requesterId, userId1), eq2(friendships.addresseeId, userId2)),
        and2(eq2(friendships.requesterId, userId2), eq2(friendships.addresseeId, userId1))
      )
    )
  ).limit(1);
  return Boolean(row);
}
async function searchUsersDb(db2, query, limit = 10, options, areFriendsFn) {
  const term = query.trim().replace(/^@/, "");
  if (!term) return [];
  let rows;
  if (options?.exact) {
    const [u] = await db2.select().from(users).where(eq2(users.username, term.toLowerCase())).limit(1);
    rows = u ? [u] : [];
  } else {
    const q = `%${term}%`;
    rows = await db2.select().from(users).where(
      or(
        ilike(users.username, q),
        ilike(users.displayName, q),
        ilike(users.firstName, q),
        ilike(users.lastName, q)
      )
    ).limit(limit * 3);
  }
  const filtered = [];
  for (const u of rows) {
    const settings = await getPrivacySettingsDb(db2, u.id);
    if (settings.isPrivateAccount && options?.viewerId !== u.id) {
      const isFriend = options?.viewerId && areFriendsFn ? await areFriendsFn(options.viewerId, u.id) : false;
      const exactMatch = u.username?.toLowerCase() === term.toLowerCase();
      if (!isFriend && !exactMatch) continue;
    }
    if (options?.travelStyle || options?.direction) {
      const [prof] = await db2.select().from(userProfiles).where(eq2(userProfiles.userId, u.id)).limit(1);
      if (options.travelStyle && prof?.travelStyle !== options.travelStyle) continue;
      if (options.direction) {
        const dests = prof?.favoriteDestinations ?? [];
        const interests = prof?.interests ?? [];
        const hay = [...dests, ...interests, prof?.travelStyle ?? ""].join(" ").toLowerCase();
        if (!hay.includes(options.direction.replace("_", " ")) && prof?.travelStyle !== options.direction) {
          continue;
        }
      }
    }
    filtered.push(u);
    if (filtered.length >= limit) break;
  }
  return filtered;
}
async function getChatRoomBySlugDb(db2, slug) {
  const [row] = await db2.select().from(chatRooms).where(eq2(chatRooms.slug, slug)).limit(1);
  return row;
}
async function getChatRoomDb(db2, id) {
  const [row] = await db2.select().from(chatRooms).where(eq2(chatRooms.id, id)).limit(1);
  return row;
}
async function countUnreadInRoomDb(db2, roomSlug, roomId, userId) {
  const [cursor] = await db2.select().from(chatRoomReadCursors).where(and2(eq2(chatRoomReadCursors.roomId, roomId), eq2(chatRoomReadCursors.userId, userId))).limit(1);
  let afterTime = null;
  if (cursor?.lastReadMessageId) {
    const [readMsg] = await db2.select({ createdAt: chatMessages.createdAt }).from(chatMessages).where(eq2(chatMessages.id, cursor.lastReadMessageId)).limit(1);
    if (readMsg?.createdAt) afterTime = new Date(readMsg.createdAt);
  }
  const conditions = [eq2(chatMessages.chatRoom, roomSlug), sql3`${chatMessages.userId} <> ${userId}`];
  if (afterTime) {
    conditions.push(sql3`${chatMessages.createdAt} > ${afterTime}`);
  }
  const [{ value }] = await db2.select({ value: count2() }).from(chatMessages).where(and2(...conditions));
  return Number(value);
}
async function listChatRoomsForUserDb(db2, userId) {
  const allRooms = await db2.select().from(chatRooms).orderBy(desc2(chatRooms.isLegacy), desc2(chatRooms.createdAt));
  const result = [];
  for (const room of allRooms) {
    const [{ value: memberCount }] = await db2.select({ value: count2() }).from(chatRoomMembers).where(and2(eq2(chatRoomMembers.roomId, room.id), eq2(chatRoomMembers.status, "active")));
    const [my] = await db2.select().from(chatRoomMembers).where(and2(eq2(chatRoomMembers.roomId, room.id), eq2(chatRoomMembers.userId, userId))).limit(1);
    if (room.visibility === "private" && (!my || my.status !== "active")) continue;
    const unreadCount = await countUnreadInRoomDb(db2, room.slug, room.id, userId);
    result.push({ ...room, memberCount: Number(memberCount), myRole: my?.role ?? null, unreadCount });
  }
  return result;
}
async function createChatRoomDb(db2, data) {
  let slug = data.slug ?? slugify(data.title);
  let n = 0;
  while (await getChatRoomBySlugDb(db2, slug)) {
    n += 1;
    slug = `${slugify(data.title)}-${n}`;
  }
  const [room] = await db2.insert(chatRooms).values({
    slug,
    title: data.title,
    description: data.description ?? null,
    avatarUrl: data.avatarUrl ?? null,
    visibility: data.visibility,
    createdBy: data.createdBy,
    settings: data.settings ?? { autoJoinOnPost: true, whoCanPost: "members" },
    isLegacy: false
  }).returning();
  await db2.insert(chatRoomMembers).values({
    roomId: room.id,
    userId: data.createdBy,
    role: "owner",
    status: "active"
  });
  return room;
}
async function updateChatRoomDb(db2, id, patch) {
  let nextPatch = patch;
  if (patch.settings) {
    const [existing] = await db2.select().from(chatRooms).where(eq2(chatRooms.id, id)).limit(1);
    if (!existing) throw new Error("Room not found");
    nextPatch = {
      ...patch,
      settings: { ...existing.settings ?? {}, ...patch.settings }
    };
  }
  const [row] = await db2.update(chatRooms).set({ ...nextPatch, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(chatRooms.id, id)).returning();
  if (!row) throw new Error("Room not found");
  return row;
}
async function getChatRoomMemberDb(db2, roomId, userId) {
  const [row] = await db2.select().from(chatRoomMembers).where(and2(eq2(chatRoomMembers.roomId, roomId), eq2(chatRoomMembers.userId, userId))).limit(1);
  return row;
}
async function joinChatRoomDb(db2, roomId, userId, role = "member") {
  const existing = await getChatRoomMemberDb(db2, roomId, userId);
  if (existing) {
    if (existing.status === "banned") throw new Error("Banned");
    const [row2] = await db2.update(chatRoomMembers).set({ status: "active" }).where(eq2(chatRoomMembers.id, existing.id)).returning();
    return row2;
  }
  const [row] = await db2.insert(chatRoomMembers).values({ roomId, userId, role, status: "active" }).returning();
  return row;
}
async function leaveChatRoomDb(db2, roomId, userId) {
  await db2.delete(chatRoomMembers).where(and2(eq2(chatRoomMembers.roomId, roomId), eq2(chatRoomMembers.userId, userId)));
}
async function getChatRoomMembersDb(db2, roomId) {
  const members = await db2.select().from(chatRoomMembers).where(and2(eq2(chatRoomMembers.roomId, roomId), eq2(chatRoomMembers.status, "active")));
  const out = [];
  for (const m of members) {
    const [u] = await db2.select().from(users).where(eq2(users.id, m.userId)).limit(1);
    if (u) out.push({ ...m, user: u });
  }
  return out;
}
async function setChatRoomMemberRoleDb(db2, roomId, userId, role) {
  const [row] = await db2.update(chatRoomMembers).set({ role }).where(and2(eq2(chatRoomMembers.roomId, roomId), eq2(chatRoomMembers.userId, userId))).returning();
  if (!row) throw new Error("Member not found");
  return row;
}
async function banChatRoomMemberDb(db2, roomId, userId) {
  await db2.update(chatRoomMembers).set({ status: "banned" }).where(and2(eq2(chatRoomMembers.roomId, roomId), eq2(chatRoomMembers.userId, userId)));
}
function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function createChatRoomInviteDb(db2, roomId, createdBy, opts) {
  const token = randomToken();
  const [row] = await db2.insert(chatRoomInvites).values({
    roomId,
    token,
    createdBy,
    expiresAt: opts?.expiresAt ?? null,
    maxUses: opts?.maxUses ?? null
  }).returning();
  return { ...row, inviteUrl: `/chat/join/${token}` };
}
async function joinChatRoomByTokenDb(db2, token, userId) {
  const [invite] = await db2.select().from(chatRoomInvites).where(eq2(chatRoomInvites.token, token)).limit(1);
  if (!invite) throw new Error("Invalid invite");
  if (invite.expiresAt && new Date(invite.expiresAt) < /* @__PURE__ */ new Date()) throw new Error("Invite expired");
  if (invite.maxUses != null && (invite.useCount ?? 0) >= invite.maxUses) throw new Error("Invite exhausted");
  const room = await getChatRoomDb(db2, invite.roomId);
  if (!room) throw new Error("Room not found");
  await joinChatRoomDb(db2, room.id, userId);
  await db2.update(chatRoomInvites).set({ useCount: (invite.useCount ?? 0) + 1 }).where(eq2(chatRoomInvites.id, invite.id));
  return room;
}
async function pinChatMessageDb(db2, roomId, messageId, pinnedBy) {
  await db2.delete(chatPinnedMessages).where(and2(eq2(chatPinnedMessages.roomId, roomId), eq2(chatPinnedMessages.messageId, messageId)));
  await db2.insert(chatPinnedMessages).values({ roomId, messageId, pinnedBy });
}
async function unpinChatMessageDb(db2, roomId, messageId) {
  await db2.delete(chatPinnedMessages).where(and2(eq2(chatPinnedMessages.roomId, roomId), eq2(chatPinnedMessages.messageId, messageId)));
}
async function getPinnedMessageIdsDb(db2, roomId) {
  const rows = await db2.select().from(chatPinnedMessages).where(eq2(chatPinnedMessages.roomId, roomId));
  return rows.map((r) => r.messageId);
}
async function deleteChatMessageDb(db2, messageId) {
  await db2.delete(chatMessages).where(eq2(chatMessages.id, messageId));
}
async function listUserTracksDb(db2, userId) {
  return db2.select().from(userTracks).where(eq2(userTracks.userId, userId)).orderBy(desc2(userTracks.createdAt));
}
async function getUserTrackDb(db2, id) {
  const [row] = await db2.select().from(userTracks).where(eq2(userTracks.id, id)).limit(1);
  return row;
}
async function createUserTrackDb(db2, data) {
  const [row] = await db2.insert(userTracks).values(data).returning();
  return row;
}
async function deleteUserTrackDb(db2, id) {
  await db2.delete(userTracks).where(eq2(userTracks.id, id));
}
async function createAdminBroadcastDb(db2, data) {
  const [row] = await db2.insert(adminBroadcasts).values(data).returning();
  return row;
}
async function getAdminBroadcastsDb(db2) {
  return db2.select().from(adminBroadcasts).orderBy(desc2(adminBroadcasts.createdAt));
}
async function getPendingAdminBroadcastDb(db2, userId) {
  const result = await db2.execute(sql3`
    SELECT b.id, b.created_by, b.content, b.is_active, b.expires_at, b.created_at
    FROM admin_broadcasts b
    WHERE b.is_active = true
      AND (b.expires_at IS NULL OR b.expires_at > now())
      AND NOT EXISTS (
        SELECT 1 FROM admin_broadcast_dismissals d
        WHERE d.broadcast_id = b.id AND d.user_id = ${userId}
      )
    ORDER BY b.created_at ASC
    LIMIT 1
  `);
  const rows = result.rows;
  const row = rows[0];
  if (!row) return void 0;
  return {
    id: row.id,
    createdBy: row.created_by,
    content: row.content,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}
async function dismissAdminBroadcastDb(db2, broadcastId, userId, action) {
  await db2.execute(sql3`
    INSERT INTO admin_broadcast_dismissals (broadcast_id, user_id, action)
    VALUES (${broadcastId}, ${userId}, ${action})
    ON CONFLICT (broadcast_id, user_id) DO NOTHING
  `);
}
async function getAllUserIdsDb(db2) {
  const rows = await db2.select({ id: users.id }).from(users);
  return rows.map((r) => r.id);
}
var init_pg_storage_features = __esm({
  "server/pg-storage-features.ts"() {
    "use strict";
    init_schema();
    init_legacy_chat_rooms();
    init_privacy_helpers();
    init_notification_storage();
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

// server/pg-storage.ts
import {
  and as and3,
  asc,
  count as count3,
  desc as desc3,
  eq as eq3,
  gte,
  ilike as ilike2,
  inArray as inArray2,
  lte,
  isNull,
  or as or2,
  sql as sql4
} from "drizzle-orm";
var PgStorage;
var init_pg_storage = __esm({
  "server/pg-storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_seed_data();
    init_admin();
    init_pg_storage_features();
    PgStorage = class {
      db;
      constructor(db2) {
        const instance = db2 ?? getDb();
        if (!instance) throw new Error("DATABASE_URL is required for PgStorage");
        this.db = instance;
      }
      async ensureSchema() {
        await ensureExtendedSchema(this.db);
        await this.db.execute(
          sql4`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar`
        );
        await this.db.execute(
          sql4`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false`
        );
        await this.db.execute(
          sql4`ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(30)`
        );
        await this.db.execute(
          sql4`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar(64)`
        );
        await this.db.execute(
          sql4`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username) WHERE username IS NOT NULL`
        );
        await this.db.execute(sql4`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      )
    `);
        await this.db.execute(
          sql4`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`
        );
      }
      async ensureSeeded() {
        await this.ensureSchema();
        await ensureLegacyChatRoomsDb(this.db);
        const [{ value }] = await this.db.select({ value: count3() }).from(places);
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
        const [row] = await this.db.select().from(users).where(eq3(users.id, id)).limit(1);
        return row;
      }
      async getUserByEmail(email) {
        const lower = email.trim().toLowerCase();
        const [row] = await this.db.select().from(users).where(sql4`lower(${users.email}) = ${lower}`).limit(1);
        return row;
      }
      async getUserByUsername(username) {
        const lower = username.trim().toLowerCase().replace(/^@/, "");
        const [row] = await this.db.select().from(users).where(sql4`lower(${users.username}) = ${lower}`).limit(1);
        return row;
      }
      async updateUserMe(userId, data) {
        const [updated] = await this.db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, userId)).returning();
        if (!updated) throw new Error("User not found");
        return updated;
      }
      async ensureUsernames() {
        const { generateUniqueUsername: generateUniqueUsername2 } = await Promise.resolve().then(() => (init_user_utils(), user_utils_exports));
        const rows = await this.db.select().from(users).where(isNull(users.username));
        for (const row of rows) {
          if (!row.email) continue;
          const username = await generateUniqueUsername2(this, row.email);
          await this.db.update(users).set({ username, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, row.id));
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
          const [updated] = await this.db.update(users).set(payload).where(eq3(users.id, id)).returning();
          return updated;
        }
        const [created] = await this.db.insert(users).values({ ...payload, createdAt: /* @__PURE__ */ new Date() }).returning();
        return created;
      }
      async setUserAdmin(userId, isAdmin2) {
        const [updated] = await this.db.update(users).set({ isAdmin: isAdmin2, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, userId)).returning();
        if (!updated) throw new Error("User not found");
        return updated;
      }
      async ensureAdminUsers() {
        const { getAdminEmails: getAdminEmails2 } = await Promise.resolve().then(() => (init_admin(), admin_exports));
        for (const email of Array.from(getAdminEmails2())) {
          const user = await this.getUserByEmail(email);
          if (user && !user.isAdmin) {
            await this.setUserAdmin(user.id, true);
            console.log(`[admin] Granted admin to ${email}`);
          }
        }
      }
      async setUserPassword(userId, passwordHash) {
        const [updated] = await this.db.update(users).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, userId)).returning();
        if (!updated) throw new Error("User not found");
        return updated;
      }
      async getPlaces(filters) {
        const conditions = [];
        if (filters?.type) conditions.push(eq3(places.type, filters.type));
        if (filters?.search) {
          const term = filters.search.trim();
          const words = term.split(/[\s,;]+/).map((w) => w.trim()).filter((w) => w.length >= 2);
          const tokens = words.length > 0 ? words : [term];
          const tokenMatches = tokens.map((word) => {
            const q = `%${word}%`;
            return or2(
              ilike2(places.name, q),
              ilike2(places.address, q),
              ilike2(places.description, q)
            );
          });
          const placeMatch = tokenMatches.length === 1 ? tokenMatches[0] : and3(...tokenMatches);
          const cityQ = `%${tokens[0] ?? term}%`;
          const cityRows = await this.db.select({ name: cities.name }).from(cities).where(or2(ilike2(cities.name, cityQ), ilike2(cities.asciiName, cityQ))).orderBy(desc3(cities.population)).limit(5);
          if (cityRows.length > 0) {
            const cityAddressMatch = or2(
              ...cityRows.map((c) => ilike2(places.address, `%${c.name}%`))
            );
            conditions.push(or2(placeMatch, cityAddressMatch));
          } else {
            conditions.push(placeMatch);
          }
        }
        if (filters?.minRating != null) {
          conditions.push(gte(places.averageRating, String(filters.minRating)));
        }
        if (filters?.priceRange) conditions.push(eq3(places.priceRange, filters.priceRange));
        let query = this.db.select().from(places);
        if (conditions.length) query = query.where(and3(...conditions));
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 20;
        return query.limit(limit).offset(offset);
      }
      async getPlace(id) {
        const [row] = await this.db.select().from(places).where(eq3(places.id, id)).limit(1);
        return row;
      }
      async createPlace(place) {
        const [row] = await this.db.insert(places).values({ ...place, reviewCount: 0, averageRating: "0" }).returning();
        return row;
      }
      async updatePlace(id, place) {
        const [row] = await this.db.update(places).set({ ...place, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(places.id, id)).returning();
        if (!row) throw new Error("Place not found");
        return row;
      }
      async getReviewsByPlace(placeId) {
        return this.db.select().from(reviews).where(eq3(reviews.placeId, placeId));
      }
      async getReviewsByUser(userId) {
        return this.db.select().from(reviews).where(eq3(reviews.userId, userId));
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
        await this.db.update(places).set({ averageRating: avg.toFixed(1), reviewCount: placeReviews.length, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(places.id, placeId));
      }
      async getTrips(filters) {
        const conditions = [];
        if (filters?.userId) conditions.push(eq3(trips.userId, filters.userId));
        if (filters?.destination) conditions.push(ilike2(trips.destination, `%${filters.destination}%`));
        if (filters?.startDate) conditions.push(gte(trips.startDate, filters.startDate));
        if (filters?.endDate) conditions.push(lte(trips.endDate, filters.endDate));
        let query = this.db.select().from(trips).orderBy(desc3(trips.startDate));
        if (conditions.length) query = query.where(and3(...conditions));
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 20;
        return query.limit(limit).offset(offset);
      }
      async getTrip(id) {
        const [row] = await this.db.select().from(trips).where(eq3(trips.id, id)).limit(1);
        return row;
      }
      async createTrip(trip) {
        const [row] = await this.db.insert(trips).values({ ...trip, currentParticipants: 1 }).returning();
        await this.db.insert(tripParticipants).values({ tripId: row.id, userId: trip.userId, status: "confirmed" });
        return row;
      }
      async joinTrip(tripId, userId) {
        const [participant] = await this.db.insert(tripParticipants).values({ tripId, userId, status: "confirmed" }).returning();
        await this.db.update(trips).set({ currentParticipants: sql4`${trips.currentParticipants} + 1`, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(trips.id, tripId));
        return participant;
      }
      async getTripParticipants(tripId) {
        return this.db.select().from(tripParticipants).where(eq3(tripParticipants.tripId, tripId));
      }
      async getTripParticipationsByUser(userId) {
        const rows = await this.db.select({ tripId: tripParticipants.tripId }).from(tripParticipants).where(eq3(tripParticipants.userId, userId));
        return rows.map((r) => r.tripId);
      }
      async getTripWaypoints(tripId) {
        const waypoints = await this.db.select().from(tripWaypoints).where(eq3(tripWaypoints.tripId, tripId)).orderBy(asc(tripWaypoints.orderIndex));
        return Promise.all(
          waypoints.map(async (w) => ({
            ...w,
            place: await this.getPlace(w.placeId) ?? null
          }))
        );
      }
      async addTripWaypoint(tripId, placeId, orderIndex, dayNumber) {
        const existing = await this.db.select().from(tripWaypoints).where(eq3(tripWaypoints.tripId, tripId));
        const nextOrder = orderIndex ?? existing.length;
        const [row] = await this.db.insert(tripWaypoints).values({ tripId, placeId, orderIndex: nextOrder, dayNumber: dayNumber ?? null }).returning();
        return row;
      }
      async getTripWaypoint(waypointId) {
        const [row] = await this.db.select().from(tripWaypoints).where(eq3(tripWaypoints.id, waypointId)).limit(1);
        return row;
      }
      async updateTripWaypoint(waypointId, data) {
        const patch = {};
        if (data.orderIndex != null) patch.orderIndex = data.orderIndex;
        if (data.dayNumber != null) patch.dayNumber = data.dayNumber;
        const [row] = await this.db.update(tripWaypoints).set(patch).where(eq3(tripWaypoints.id, waypointId)).returning();
        return row;
      }
      async removeTripWaypoint(waypointId) {
        await this.db.delete(tripWaypoints).where(eq3(tripWaypoints.id, waypointId));
      }
      async getEvents(filters) {
        const conditions = [];
        if (filters?.type) conditions.push(eq3(events.type, filters.type));
        if (filters?.upcoming) conditions.push(gte(events.startDate, /* @__PURE__ */ new Date()));
        let query = this.db.select().from(events).orderBy(asc(events.startDate));
        if (conditions.length) query = query.where(and3(...conditions));
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 20;
        return query.limit(limit).offset(offset);
      }
      async getEvent(id) {
        const [row] = await this.db.select().from(events).where(eq3(events.id, id)).limit(1);
        return row;
      }
      async createEvent(event) {
        const [row] = await this.db.insert(events).values(event).returning();
        return row;
      }
      async registerForEvent(eventId, userId) {
        const existing = await this.isRegisteredForEvent(eventId, userId);
        if (existing) {
          const [row2] = await this.db.select().from(eventRegistrations).where(and3(eq3(eventRegistrations.eventId, eventId), eq3(eventRegistrations.userId, userId))).limit(1);
          return row2;
        }
        const [row] = await this.db.insert(eventRegistrations).values({ eventId, userId }).returning();
        return row;
      }
      async unregisterFromEvent(eventId, userId) {
        await this.db.delete(eventRegistrations).where(and3(eq3(eventRegistrations.eventId, eventId), eq3(eventRegistrations.userId, userId)));
      }
      async getRegisteredEventIds(userId) {
        const rows = await this.db.select({ eventId: eventRegistrations.eventId }).from(eventRegistrations).where(eq3(eventRegistrations.userId, userId));
        return rows.map((r) => r.eventId);
      }
      async isRegisteredForEvent(eventId, userId) {
        const [row] = await this.db.select().from(eventRegistrations).where(and3(eq3(eventRegistrations.eventId, eventId), eq3(eventRegistrations.userId, userId))).limit(1);
        return Boolean(row);
      }
      async getChatMessages(chatRoom, limit = 50) {
        const rows = await this.db.select().from(chatMessages).where(eq3(chatMessages.chatRoom, chatRoom)).orderBy(asc(chatMessages.createdAt));
        return rows.slice(-limit);
      }
      async createChatMessage(message) {
        const [row] = await this.db.insert(chatMessages).values(message).returning();
        return row;
      }
      async getUserFavorites(userId) {
        return this.db.select().from(userFavorites).where(eq3(userFavorites.userId, userId));
      }
      async addFavorite(userId, placeId) {
        const [row] = await this.db.insert(userFavorites).values({ userId, placeId }).returning();
        return row;
      }
      async removeFavorite(userId, placeId) {
        await this.db.delete(userFavorites).where(and3(eq3(userFavorites.userId, userId), eq3(userFavorites.placeId, placeId)));
      }
      async isFavorite(userId, placeId) {
        const [row] = await this.db.select().from(userFavorites).where(and3(eq3(userFavorites.userId, userId), eq3(userFavorites.placeId, placeId))).limit(1);
        return Boolean(row);
      }
      async getUserProfile(userId) {
        const [row] = await this.db.select().from(userProfiles).where(eq3(userProfiles.userId, userId)).limit(1);
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
        const [row] = await this.db.update(userProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(userProfiles.userId, userId)).returning();
        return row;
      }
      async getFriendshipById(friendshipId) {
        const [row] = await this.db.select().from(friendships).where(eq3(friendships.id, friendshipId)).limit(1);
        return row;
      }
      async areFriends(userId1, userId2) {
        return areFriendsDb(this.db, userId1, userId2);
      }
      async sendFriendRequest(requesterId, addresseeId, direction) {
        const [row] = await this.db.insert(friendships).values({ requesterId, addresseeId, status: "pending", direction: direction ?? null }).returning();
        return row;
      }
      async respondToFriendRequest(friendshipId, status, direction) {
        const patch = {
          status,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (direction && status === "accepted") patch.direction = direction;
        const [row] = await this.db.update(friendships).set(patch).where(eq3(friendships.id, friendshipId)).returning();
        if (!row) throw new Error("Friendship not found");
        return row;
      }
      async getFriends(userId, direction) {
        const conditions = [
          eq3(friendships.status, "accepted"),
          or2(eq3(friendships.requesterId, userId), eq3(friendships.addresseeId, userId))
        ];
        if (direction) conditions.push(eq3(friendships.direction, direction));
        const accepted = await this.db.select().from(friendships).where(and3(...conditions));
        const friendIds = accepted.map((f) => f.requesterId === userId ? f.addresseeId : f.requesterId);
        if (!friendIds.length) return [];
        return this.db.select().from(users).where(inArray2(users.id, friendIds));
      }
      async getFriendRequests(userId, type) {
        if (type === "sent") {
          return this.db.select().from(friendships).where(and3(eq3(friendships.requesterId, userId), eq3(friendships.status, "pending")));
        }
        return this.db.select().from(friendships).where(and3(eq3(friendships.addresseeId, userId), eq3(friendships.status, "pending")));
      }
      async removeFriend(userId, friendId) {
        await this.db.delete(friendships).where(
          or2(
            and3(eq3(friendships.requesterId, userId), eq3(friendships.addresseeId, friendId)),
            and3(eq3(friendships.requesterId, friendId), eq3(friendships.addresseeId, userId))
          )
        );
      }
      async followUser(followerId, followingId) {
        const [row] = await this.db.insert(userFollows).values({ followerId, followingId }).returning();
        return row;
      }
      async unfollowUser(followerId, followingId) {
        await this.db.delete(userFollows).where(and3(eq3(userFollows.followerId, followerId), eq3(userFollows.followingId, followingId)));
      }
      async getFollowers(userId) {
        const rows = await this.db.select().from(userFollows).where(eq3(userFollows.followingId, userId));
        if (!rows.length) return [];
        return this.db.select().from(users).where(inArray2(users.id, rows.map((r) => r.followerId)));
      }
      async getFollowing(userId) {
        const rows = await this.db.select().from(userFollows).where(eq3(userFollows.followerId, userId));
        if (!rows.length) return [];
        return this.db.select().from(users).where(inArray2(users.id, rows.map((r) => r.followingId)));
      }
      async isFollowing(followerId, followingId) {
        const [row] = await this.db.select().from(userFollows).where(and3(eq3(userFollows.followerId, followerId), eq3(userFollows.followingId, followingId))).limit(1);
        return Boolean(row);
      }
      async sendPrivateMessage(message) {
        const [row] = await this.db.insert(privateMessages).values(message).returning();
        return row;
      }
      async getPrivateMessages(userId1, userId2, limit = 50) {
        const rows = await this.db.select().from(privateMessages).where(
          or2(
            and3(eq3(privateMessages.senderId, userId1), eq3(privateMessages.receiverId, userId2)),
            and3(eq3(privateMessages.senderId, userId2), eq3(privateMessages.receiverId, userId1))
          )
        ).orderBy(asc(privateMessages.createdAt));
        return rows.slice(-limit);
      }
      async getConversations(userId) {
        const msgs = await this.db.select().from(privateMessages).where(or2(eq3(privateMessages.senderId, userId), eq3(privateMessages.receiverId, userId))).orderBy(desc3(privateMessages.createdAt));
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
          and3(
            eq3(privateMessages.receiverId, userId),
            eq3(privateMessages.senderId, senderId),
            eq3(privateMessages.isRead, false)
          )
        );
      }
      async createTravelPost(post) {
        const [row] = await this.db.insert(travelPosts).values(post).returning();
        return row;
      }
      async getTravelPosts(filters) {
        const conditions = [];
        if (filters?.format) conditions.push(eq3(travelPosts.format, filters.format));
        conditions.push(
          sql4`(${travelPosts.format} <> 'story' OR ${travelPosts.expiresAt} IS NULL OR ${travelPosts.expiresAt} > NOW())`
        );
        if (filters?.publicOnly) {
          conditions.push(eq3(travelPosts.isPublic, true));
          conditions.push(sql4`${travelPosts.format} IN ('post', 'journal')`);
        }
        if (filters?.userId) conditions.push(eq3(travelPosts.userId, filters.userId));
        if (filters?.following) {
          const followingRows = await this.db.select({ id: userFollows.followingId }).from(userFollows).where(eq3(userFollows.followerId, filters.following));
          const ids = Array.from(/* @__PURE__ */ new Set([filters.following, ...followingRows.map((r) => r.id)]));
          conditions.push(inArray2(travelPosts.userId, ids));
        }
        if (filters?.tag) {
          conditions.push(
            sql4`EXISTS (SELECT 1 FROM unnest(${travelPosts.tags}) AS t(tag) WHERE lower(t.tag) = ${filters.tag.toLowerCase()})`
          );
        }
        let query = this.db.select().from(travelPosts).orderBy(desc3(travelPosts.createdAt));
        if (conditions.length) query = query.where(and3(...conditions));
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 20;
        return query.limit(limit).offset(offset);
      }
      async getTravelPost(id) {
        const [row] = await this.db.select().from(travelPosts).where(eq3(travelPosts.id, id)).limit(1);
        return row;
      }
      async updateTravelPost(id, post) {
        const [row] = await this.db.update(travelPosts).set({ ...post, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(travelPosts.id, id)).returning();
        if (!row) throw new Error("Post not found");
        return row;
      }
      async deleteTravelPost(id) {
        await this.db.delete(travelPosts).where(eq3(travelPosts.id, id));
      }
      async likePost(userId, postId) {
        const [row] = await this.db.insert(postLikes).values({ userId, postId }).returning();
        return row;
      }
      async unlikePost(userId, postId) {
        await this.db.delete(postLikes).where(and3(eq3(postLikes.userId, userId), eq3(postLikes.postId, postId)));
      }
      async addPostComment(comment) {
        const [row] = await this.db.insert(postComments).values(comment).returning();
        return row;
      }
      async getPostComments(postId) {
        return this.db.select().from(postComments).where(eq3(postComments.postId, postId)).orderBy(asc(postComments.createdAt));
      }
      async getPostComment(id) {
        const [row] = await this.db.select().from(postComments).where(eq3(postComments.id, id)).limit(1);
        return row;
      }
      async deletePostComment(id) {
        await this.db.delete(postComments).where(eq3(postComments.id, id));
      }
      async searchUsers(query, limit = 10, options) {
        return searchUsersDb(this.db, query, limit, options, (a, b) => this.areFriends(a, b));
      }
      async getPrivacySettings(userId) {
        return getPrivacySettingsDb(this.db, userId);
      }
      async updatePrivacySettings(userId, patch) {
        return updatePrivacySettingsDb(this.db, userId, patch);
      }
      async touchPresence(userId, isOnline) {
        return touchPresenceDb(this.db, userId, isOnline);
      }
      async getPresence(userId) {
        return getPresenceDb(this.db, userId);
      }
      async ensureLegacyChatRooms() {
        return ensureLegacyChatRoomsDb(this.db);
      }
      async getChatRoomBySlug(slug) {
        return getChatRoomBySlugDb(this.db, slug);
      }
      async getChatRoom(id) {
        return getChatRoomDb(this.db, id);
      }
      async listChatRoomsForUser(userId) {
        return listChatRoomsForUserDb(this.db, userId);
      }
      async createChatRoom(data) {
        return createChatRoomDb(this.db, data);
      }
      async updateChatRoom(id, patch) {
        return updateChatRoomDb(this.db, id, patch);
      }
      async getChatRoomMember(roomId, userId) {
        return getChatRoomMemberDb(this.db, roomId, userId);
      }
      async joinChatRoom(roomId, userId, role) {
        return joinChatRoomDb(this.db, roomId, userId, role);
      }
      async leaveChatRoom(roomId, userId) {
        return leaveChatRoomDb(this.db, roomId, userId);
      }
      async getChatRoomMembers(roomId) {
        return getChatRoomMembersDb(this.db, roomId);
      }
      async setChatRoomMemberRole(roomId, userId, role) {
        return setChatRoomMemberRoleDb(this.db, roomId, userId, role);
      }
      async banChatRoomMember(roomId, userId) {
        return banChatRoomMemberDb(this.db, roomId, userId);
      }
      async createChatRoomInvite(roomId, createdBy, opts) {
        return createChatRoomInviteDb(this.db, roomId, createdBy, opts);
      }
      async joinChatRoomByToken(token, userId) {
        return joinChatRoomByTokenDb(this.db, token, userId);
      }
      async getChatMessage(messageId) {
        return getChatMessageDb(this.db, messageId);
      }
      async updateChatMessage(messageId, content) {
        return updateChatMessageDb(this.db, messageId, content);
      }
      async getChatMessageLikeMeta(messageIds, viewerId) {
        return getChatMessageLikeMetaDb(this.db, messageIds, viewerId);
      }
      async toggleChatMessageLike(messageId, userId) {
        return toggleChatMessageLikeDb(this.db, messageId, userId);
      }
      async getChatMessageReactionsMeta(messageIds, viewerId) {
        return getChatMessageReactionsMetaDb(this.db, messageIds, viewerId);
      }
      async setChatMessageReaction(messageId, userId, emoji) {
        return setChatMessageReactionDb(this.db, messageId, userId, emoji);
      }
      async getChatMessageReactionDetails(messageId) {
        return getChatMessageReactionDetailsDb(this.db, messageId);
      }
      async upsertChatRoomReadCursor(roomId, userId, lastReadMessageId) {
        return upsertChatRoomReadCursorDb(this.db, roomId, userId, lastReadMessageId);
      }
      async getChatMessageReaders(roomId, messageId, excludeUserId) {
        return getChatMessageReadersDb(this.db, roomId, messageId, excludeUserId);
      }
      async getChatMessageReadMeta(roomId, messageIds, authorId) {
        return getChatMessageReadMetaDb(this.db, roomId, messageIds, authorId);
      }
      async pinChatMessage(roomId, messageId, pinnedBy) {
        return pinChatMessageDb(this.db, roomId, messageId, pinnedBy);
      }
      async unpinChatMessage(roomId, messageId) {
        return unpinChatMessageDb(this.db, roomId, messageId);
      }
      async getPinnedMessageIds(roomId) {
        return getPinnedMessageIdsDb(this.db, roomId);
      }
      async deleteChatMessage(messageId) {
        return deleteChatMessageDb(this.db, messageId);
      }
      async getPrivateMessage(messageId) {
        return getPrivateMessageDb(this.db, messageId);
      }
      async updatePrivateMessage(messageId, content) {
        return updatePrivateMessageDb(this.db, messageId, content);
      }
      async deletePrivateMessage(messageId) {
        return deletePrivateMessageDb(this.db, messageId);
      }
      async getPrivateMessageLikeMeta(messageIds, viewerId) {
        return getPrivateMessageLikeMetaDb(this.db, messageIds, viewerId);
      }
      async togglePrivateMessageLike(messageId, userId) {
        return togglePrivateMessageLikeDb(this.db, messageId, userId);
      }
      async getPrivateMessageReactionsMeta(messageIds, viewerId) {
        return getPrivateMessageReactionsMetaDb(this.db, messageIds, viewerId);
      }
      async setPrivateMessageReaction(messageId, userId, emoji) {
        return setPrivateMessageReactionDb(this.db, messageId, userId, emoji);
      }
      async getPrivateMessageReactionDetails(messageId) {
        return getPrivateMessageReactionDetailsDb(this.db, messageId);
      }
      async markPrivateMessagesDelivered(receiverId, senderId) {
        return markPrivateMessagesDeliveredDb(this.db, receiverId, senderId);
      }
      async createNotification(data) {
        const { createNotificationDb: createNotificationDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return createNotificationDb2(this.db, data);
      }
      async getNotifications(userId, limit = 50) {
        const { getNotificationsDb: getNotificationsDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return getNotificationsDb2(this.db, userId, limit);
      }
      async getUnreadNotificationCount(userId) {
        const { getUnreadNotificationCountDb: getUnreadNotificationCountDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return getUnreadNotificationCountDb2(this.db, userId);
      }
      async markNotificationRead(userId, id) {
        const { markNotificationReadDb: markNotificationReadDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return markNotificationReadDb2(this.db, userId, id);
      }
      async markAllNotificationsRead(userId) {
        const { markAllNotificationsReadDb: markAllNotificationsReadDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return markAllNotificationsReadDb2(this.db, userId);
      }
      async upsertPushSubscription(userId, sub) {
        const { upsertPushSubscriptionDb: upsertPushSubscriptionDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return upsertPushSubscriptionDb2(this.db, userId, sub);
      }
      async getPushSubscriptionsForUser(userId) {
        const { getPushSubscriptionsForUserDb: getPushSubscriptionsForUserDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return getPushSubscriptionsForUserDb2(this.db, userId);
      }
      async deletePushSubscription(endpoint) {
        const { deletePushSubscriptionDb: deletePushSubscriptionDb2 } = await Promise.resolve().then(() => (init_notification_storage(), notification_storage_exports));
        return deletePushSubscriptionDb2(this.db, endpoint);
      }
      async getPostLikesCount(postId) {
        const [{ value }] = await this.db.select({ value: count3() }).from(postLikes).where(eq3(postLikes.postId, postId));
        return Number(value);
      }
      async isPostLikedByUser(userId, postId) {
        const [row] = await this.db.select().from(postLikes).where(and3(eq3(postLikes.userId, userId), eq3(postLikes.postId, postId))).limit(1);
        return Boolean(row);
      }
      async getPostCommentsCount(postId) {
        const [{ value }] = await this.db.select({ value: count3() }).from(postComments).where(eq3(postComments.postId, postId));
        return Number(value);
      }
      async getUserTrips(userId) {
        return this.getTrips({ userId });
      }
      async deleteUserAccount(userId) {
        await this.db.delete(users).where(eq3(users.id, userId));
      }
      async listUserTracks(userId) {
        return listUserTracksDb(this.db, userId);
      }
      async getUserTrack(id) {
        return getUserTrackDb(this.db, id);
      }
      async createUserTrack(data) {
        return createUserTrackDb(this.db, data);
      }
      async deleteUserTrack(id) {
        return deleteUserTrackDb(this.db, id);
      }
      async createAdminBroadcast(data) {
        return createAdminBroadcastDb(this.db, data);
      }
      async getAdminBroadcasts() {
        return getAdminBroadcastsDb(this.db);
      }
      async getPendingAdminBroadcast(userId) {
        return getPendingAdminBroadcastDb(this.db, userId);
      }
      async dismissAdminBroadcast(broadcastId, userId, action) {
        return dismissAdminBroadcastDb(this.db, broadcastId, userId, action);
      }
      async getAllUserIds() {
        return getAllUserIdsDb(this.db);
      }
      async exportUserData(userId) {
        const user = await this.getUser(userId);
        if (!user) throw new Error("User not found");
        const { passwordHash: _pw, ...userSafe } = user;
        return {
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          user: userSafe,
          profile: await this.getUserProfile(userId) ?? null,
          trips: await this.getUserTrips(userId),
          posts: await this.getTravelPosts({ userId }),
          reviews: await this.getReviewsByUser(userId),
          favorites: await this.getUserFavorites(userId)
        };
      }
    };
  }
});

// server/google-auth.ts
import * as client from "openid-client";
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
        const safeRedirect2 = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
        res.redirect(safeRedirect2);
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
var googleConfig;
var init_google_auth = __esm({
  "server/google-auth.ts"() {
    "use strict";
    init_storage();
    googleConfig = null;
  }
});

// server/security.ts
function isProductionEnv() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}
function resolveSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (isProductionEnv()) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "SESSION_SECRET must be set to a random string of at least 32 characters in production"
      );
    }
    return secret;
  }
  return secret || "dev-secret-change-in-production";
}
async function userCanManageTrip(storage2, userId, tripId) {
  const trip = await storage2.getTrip(tripId);
  if (!trip) return false;
  if (trip.userId === userId) return true;
  const participants = await storage2.getTripParticipants(tripId);
  return participants.some(
    (p) => p.userId === userId && (p.status === "accepted" || p.status === "pending")
  );
}
function redactForLog(value, depth = 0) {
  if (depth > 4) return "[\u2026]";
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((v) => redactForLog(v, depth + 1));
  }
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
    } else {
      out[key] = redactForLog(val, depth + 1);
    }
  }
  return out;
}
var SENSITIVE_KEYS;
var init_security = __esm({
  "server/security.ts"() {
    "use strict";
    SENSITIVE_KEYS = /* @__PURE__ */ new Set([
      "email",
      "password",
      "passwordHash",
      "content",
      "message",
      "token",
      "secret",
      "authorization"
    ]);
  }
});

// server/auth-middleware.ts
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
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
      createTableIfMissing: false
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
function applyPassportMiddleware(app) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
}
var SESSION_SECRET, PgSession, MemoryStore, sessionMiddleware;
var init_auth_middleware = __esm({
  "server/auth-middleware.ts"() {
    "use strict";
    init_db();
    init_security();
    SESSION_SECRET = resolveSessionSecret();
    PgSession = connectPgSimple(session);
    MemoryStore = createMemoryStore(session);
    sessionMiddleware = null;
  }
});

// server/password.ts
import bcrypt from "bcryptjs";
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function isPasswordLongEnough(password) {
  return password.length >= MIN_PASSWORD_LENGTH;
}
var SALT_ROUNDS, MIN_PASSWORD_LENGTH;
var init_password = __esm({
  "server/password.ts"() {
    "use strict";
    SALT_ROUNDS = 10;
    MIN_PASSWORD_LENGTH = 8;
  }
});

// server/auth-session.ts
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
var init_auth_session = __esm({
  "server/auth-session.ts"() {
    "use strict";
  }
});

// server/rate-limit.ts
import rateLimit from "express-rate-limit";
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}
var authLoginLimiter;
var init_rate_limit = __esm({
  "server/rate-limit.ts"() {
    "use strict";
    authLoginLimiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `login:${clientIp(req)}`,
      message: { ok: false, error: "rate_limit", message: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u0432\u0445\u043E\u0434\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435." }
    });
  }
});

// server/local-auth.ts
import passport2 from "passport";
import { Strategy as LocalStrategy } from "passport-local";
async function syncAdminRole(user) {
  if (!resolveIsAdmin(user.email) || user.isAdmin) return user;
  return storage.setUserAdmin(user.id, true);
}
async function ensureAuthSchema() {
  if (!storage.ensureSchema) return;
  if (!schemaReady) {
    schemaReady = storage.ensureSchema().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
}
async function authenticateLocal(email, password) {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      reason: "error",
      message: "\u0411\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0430 (DATABASE_URL \u043D\u0430 Vercel)",
      code: "NO_DATABASE"
    };
  }
  try {
    await ensureAuthSchema();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { ok: false, reason: "invalid" };
    }
    if (!isPasswordLongEnough(password)) {
      return { ok: false, reason: "invalid" };
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
      return { ok: true, user: toSessionUser(user) };
    }
    if (!user.passwordHash) {
      const passwordHash = await hashPassword(password);
      user = await storage.setUserPassword(user.id, passwordHash);
      user = await syncAdminRole(user);
      return { ok: true, user: toSessionUser(user) };
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { ok: false, reason: "invalid" };
    }
    user = await syncAdminRole(user);
    return { ok: true, user: toSessionUser(user) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth] authenticateLocal:", message);
    const code = message.includes("password_hash") || message.includes("column") ? "SCHEMA" : message.includes("connect") || message.includes("timeout") ? "DB_CONNECT" : "UNKNOWN";
    return { ok: false, reason: "error", message, code };
  }
}
function registerLocalPassportStrategy() {
  if (localStrategyReady) return;
  localStrategyReady = true;
  passport2.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        const result = await authenticateLocal(String(email ?? ""), String(password ?? ""));
        if (result.ok) return done(null, result.user);
        if (result.reason === "invalid") {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(new Error(result.message));
      }
    )
  );
}
function safeRedirect(raw) {
  const r = raw ?? "/";
  return r.startsWith("/") && !r.startsWith("//") && !r.includes("://") ? r : "/";
}
function promisifyLogin(req, user) {
  return new Promise((resolve, reject) => {
    req.logIn(user, (err) => err ? reject(err) : resolve());
  });
}
function registerLoginRoutes(app) {
  app.get("/api/login", (_req, res) => {
    res.redirect("/login");
  });
  app.post("/api/auth/login", authLoginLimiter, async (req, res) => {
    const email = String(req.body?.email ?? "").trim();
    const password = String(req.body?.password ?? "");
    const redirectTo = safeRedirect(
      typeof req.body?.redirect === "string" ? req.body.redirect : void 0
    );
    const result = await authenticateLocal(email, password);
    if (!result.ok) {
      if (result.reason === "invalid") {
        return res.status(401).json({ ok: false, error: "invalid", message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" });
      }
      return res.status(500).json({
        ok: false,
        error: "server",
        code: isProductionEnv() ? "SERVER" : result.code ?? "UNKNOWN",
        message: isProductionEnv() ? "\u0412\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435." : result.message
      });
    }
    try {
      await promisifyLogin(req, result.user);
      return res.json({ ok: true, redirect: redirectTo });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[auth] session save failed:", message);
      return res.status(500).json({
        ok: false,
        error: "server",
        code: "SESSION",
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u0443 sessions \u0432 \u0411\u0414."
      });
    }
  });
  app.post("/api/login", authLoginLimiter, (req, res, next) => {
    const redirectTo = safeRedirect(
      typeof req.query.redirect === "string" ? req.query.redirect : "/"
    );
    passport2.authenticate("local", (err, user) => {
      if (err) {
        console.error("[auth] POST /api/login authenticate:", err);
        const q = new URLSearchParams({ error: "server" });
        if (redirectTo !== "/") q.set("redirect", redirectTo);
        return res.redirect(`/login?${q.toString()}`);
      }
      if (!user) {
        const q = new URLSearchParams({ error: "invalid" });
        if (redirectTo !== "/") q.set("redirect", redirectTo);
        return res.redirect(`/login?${q.toString()}`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("[auth] session save failed:", loginErr);
          const q = new URLSearchParams({ error: "server" });
          if (redirectTo !== "/") q.set("redirect", redirectTo);
          return res.redirect(`/login?${q.toString()}`);
        }
        return res.redirect(redirectTo);
      });
    })(req, res, next);
  });
}
var schemaReady, localStrategyReady;
var init_local_auth = __esm({
  "server/local-auth.ts"() {
    "use strict";
    init_storage();
    init_db();
    init_password();
    init_admin();
    init_auth_session();
    init_rate_limit();
    init_security();
    schemaReady = null;
    localStrategyReady = false;
  }
});

// server/auth.ts
async function setupAuth(app) {
  applyPassportMiddleware(app);
  registerLocalPassportStrategy();
  registerLoginRoutes(app);
  const googleSetup = setupGoogleAuth(app).catch((err) => {
    console.error("[auth] Google OAuth setup skipped:", err);
  });
  if (!process.env.VERCEL) {
    try {
      await Promise.race([
        googleSetup,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Google OAuth setup timeout")), 1e4)
        )
      ]);
    } catch (err) {
      console.error("[auth] Google OAuth setup skipped:", err);
    }
  }
  const handleLogout = (req, res) => {
    req.logout((err) => {
      if (err) return res.redirect("/");
      res.redirect("/");
    });
  };
  app.get("/api/logout", handleLogout);
  app.post("/api/logout", handleLogout);
}
var isAuthenticated, isAdmin;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    init_google_auth();
    init_auth_middleware();
    init_local_auth();
    init_auth_middleware();
    isAuthenticated = async (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      if (!user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    };
    isAdmin = async (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const sessionUser = req.user;
      const userId = sessionUser?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const dbUser = await storage.getUser(userId);
      if (!dbUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  }
});

// server/push.ts
import webpush from "web-push";
function setupPushRoutes(app) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@allintravel.app";
  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: publicKey ?? null, enabled: Boolean(publicKey && privateKey) });
  });
  app.post("/api/push/subscribe", isAuthenticated, async (req, res) => {
    const userId = req.user.claims.sub;
    const sub = req.body;
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    await storage.upsertPushSubscription(userId, sub);
    res.status(201).json({ ok: true });
  });
  app.delete("/api/push/subscribe", isAuthenticated, async (req, res) => {
    const endpoint = String(req.body?.endpoint ?? "");
    if (endpoint) await storage.deletePushSubscription(endpoint);
    res.status(204).send();
  });
  app.post("/api/push/test", isAuthenticated, async (req, res) => {
    if (!publicKey || !privateKey) {
      return res.status(503).json({ message: "Push not configured (VAPID keys)" });
    }
    const userId = req.user.claims.sub;
    try {
      await sendPushToUser(userId, {
        title: "All In Travel",
        body: "Push-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442!",
        url: "/profile/settings"
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("Push test error:", err);
      res.status(500).json({ message: "Failed to send push \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0443 \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435" });
    }
  });
}
async function sendPushToUser(userId, payload) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  const subs = await storage.getPushSubscriptionsForUser(userId);
  if (!subs.length) return;
  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag,
    sound: payload.sound ?? DEFAULT_PUSH_SOUND
  });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          data
        );
      } catch (err) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          await storage.deletePushSubscription(sub.endpoint);
        }
        console.error("Push send failed:", err);
      }
    })
  );
}
var DEFAULT_PUSH_SOUND;
var init_push = __esm({
  "server/push.ts"() {
    "use strict";
    init_auth();
    init_storage();
    DEFAULT_PUSH_SOUND = "/sounds/notify-short.wav";
  }
});

// server/realtime-hub.ts
var realtime_hub_exports = {};
__export(realtime_hub_exports, {
  broadcastToUser: () => broadcastToUser,
  isUserOnline: () => isUserOnline,
  registerUserSocket: () => registerUserSocket,
  unregisterUserSocket: () => unregisterUserSocket
});
function registerUserSocket(userId, ws) {
  let set = userSockets.get(userId);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    userSockets.set(userId, set);
  }
  set.add(ws);
}
function unregisterUserSocket(userId, ws) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(userId);
}
function broadcastToUser(userId, payload) {
  const set = userSockets.get(userId);
  if (!set?.size) return;
  const data = JSON.stringify(payload);
  for (const ws of Array.from(set)) {
    if (ws.readyState === OPEN) {
      try {
        ws.send(data);
      } catch {
        set.delete(ws);
      }
    } else {
      set.delete(ws);
    }
  }
}
function isUserOnline(userId) {
  const set = userSockets.get(userId);
  return Boolean(set && set.size > 0);
}
var OPEN, userSockets;
var init_realtime_hub = __esm({
  "server/realtime-hub.ts"() {
    "use strict";
    OPEN = 1;
    userSockets = /* @__PURE__ */ new Map();
  }
});

// shared/user-display.ts
function getUserDisplayLabel(u) {
  if (u.displayName?.trim()) return u.displayName.trim();
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (u.username) return `@${u.username}`;
  const local = u.email?.split("@")[0];
  if (local) return local;
  return "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C";
}
var init_user_display = __esm({
  "shared/user-display.ts"() {
    "use strict";
  }
});

// server/notification-service.ts
var notification_service_exports = {};
__export(notification_service_exports, {
  labelForUser: () => labelForUser,
  notifyChatMessagePinned: () => notifyChatMessagePinned,
  notifyEventRegistration: () => notifyEventRegistration,
  notifyFriendAccepted: () => notifyFriendAccepted,
  notifyFriendRequest: () => notifyFriendRequest,
  notifyGroupJoin: () => notifyGroupJoin,
  notifyNewMessage: () => notifyNewMessage,
  notifyTripJoin: () => notifyTripJoin,
  notifyUser: () => notifyUser,
  setNotificationStorage: () => setNotificationStorage
});
function setNotificationStorage(storage2) {
  storageRef = storage2;
}
async function notifyUser(input) {
  if (!storageRef) return;
  const row = await storageRef.createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    actorId: input.actorId ?? null,
    entityId: input.entityId ?? null
  });
  const payload = {
    type: "notification",
    notification: {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      link: row.link,
      actorId: row.actorId,
      entityId: row.entityId,
      isRead: row.isRead,
      createdAt: row.createdAt?.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString()
    }
  };
  broadcastToUser(input.userId, payload);
  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    url: input.link ?? "/",
    tag: `${input.type}-${input.entityId ?? row.id}`
  });
}
async function labelForUser(user, fallback = "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C") {
  if (!user) return fallback;
  return getUserDisplayLabel(user);
}
async function notifyFriendRequest(storage2, addresseeId, requester, friendshipId) {
  const name = getUserDisplayLabel(requester);
  await notifyUser({
    userId: addresseeId,
    type: "friend_request",
    title: "\u0417\u0430\u044F\u0432\u043A\u0430 \u0432 \u0434\u0440\u0443\u0437\u044C\u044F",
    body: `${name} \u0445\u043E\u0447\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0430\u0441 \u0432 \u0434\u0440\u0443\u0437\u044C\u044F`,
    link: "/profile/friends",
    actorId: requester.id,
    entityId: friendshipId
  });
}
async function notifyFriendAccepted(storage2, requesterId, accepter, friendshipId) {
  const name = getUserDisplayLabel(accepter);
  await notifyUser({
    userId: requesterId,
    type: "friend_accepted",
    title: "\u0417\u0430\u044F\u0432\u043A\u0430 \u043F\u0440\u0438\u043D\u044F\u0442\u0430",
    body: `${name} \u043F\u0440\u0438\u043D\u044F\u043B(\u0430) \u0432\u0430\u0448\u0443 \u0437\u0430\u044F\u0432\u043A\u0443 \u0432 \u0434\u0440\u0443\u0437\u044C\u044F`,
    link: "/profile/friends",
    actorId: accepter.id,
    entityId: friendshipId
  });
}
async function notifyNewMessage(receiverId, sender, preview) {
  const name = getUserDisplayLabel(sender);
  const body = preview.length > 120 ? `${preview.slice(0, 117)}\u2026` : preview;
  await notifyUser({
    userId: receiverId,
    type: "message",
    title: `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442 ${name}`,
    body,
    link: `/messages?with=${sender.id}`,
    actorId: sender.id,
    entityId: sender.id
  });
}
async function notifyTripJoin(ownerId, joiner, tripId, tripTitle) {
  if (ownerId === joiner.id) return;
  const name = getUserDisplayLabel(joiner);
  await notifyUser({
    userId: ownerId,
    type: "trip_join",
    title: "\u041D\u043E\u0432\u044B\u0439 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A \u043F\u043E\u0435\u0437\u0434\u043A\u0438",
    body: `${name} \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0441\u044F \u043A \xAB${tripTitle}\xBB`,
    link: `/trips/${tripId}`,
    actorId: joiner.id,
    entityId: tripId
  });
}
async function notifyEventRegistration(organizerId, registrant, eventId, eventTitle) {
  if (!organizerId || organizerId === registrant.id) return;
  const name = getUserDisplayLabel(registrant);
  await notifyUser({
    userId: organizerId,
    type: "event_registration",
    title: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043D\u0430 \u0441\u043E\u0431\u044B\u0442\u0438\u0435",
    body: `${name} \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0441\u044F \u043D\u0430 \xAB${eventTitle}\xBB`,
    link: `/events`,
    actorId: registrant.id,
    entityId: eventId
  });
}
async function notifyGroupJoin(adminIds, joiner, roomTitle, roomSlug) {
  const name = getUserDisplayLabel(joiner);
  for (const adminId of adminIds) {
    if (adminId === joiner.id) continue;
    await notifyUser({
      userId: adminId,
      type: "group_join",
      title: "\u041D\u043E\u0432\u044B\u0439 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A \u0433\u0440\u0443\u043F\u043F\u044B",
      body: `${name} \u0432\u0441\u0442\u0443\u043F\u0438\u043B \u0432 \xAB${roomTitle}\xBB`,
      link: `/chat`,
      actorId: joiner.id,
      entityId: roomSlug
    });
  }
}
async function notifyChatMessagePinned(memberIds, pinner, roomTitle, roomSlug, messageId, preview) {
  const name = getUserDisplayLabel(pinner);
  const body = preview.length > 120 ? `${preview.slice(0, 117)}\u2026` : preview;
  const link = `/chat?room=${encodeURIComponent(roomSlug)}&message=${messageId}`;
  for (const memberId of memberIds) {
    if (memberId === pinner.id) continue;
    await notifyUser({
      userId: memberId,
      type: "message_pinned",
      title: `\u0417\u0430\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u043E \u0432 \xAB${roomTitle}\xBB`,
      body: `${name}: ${body}`,
      link,
      actorId: pinner.id,
      entityId: messageId
    });
  }
}
var storageRef;
var init_notification_service = __esm({
  "server/notification-service.ts"() {
    "use strict";
    init_push();
    init_realtime_hub();
    init_user_display();
    storageRef = null;
  }
});

// server/storage.ts
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function initAppStorage() {
  const { setNotificationStorage: setNotificationStorage2 } = await Promise.resolve().then(() => (init_notification_service(), notification_service_exports));
  setNotificationStorage2(storage);
  try {
    if (storage instanceof PgStorage) {
      await storage.ensureSchema();
      if (!process.env.VERCEL) {
        await storage.ensureSeeded();
      }
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
var MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_privacy();
    init_legacy_chat_rooms();
    init_db();
    init_pg_storage();
    MemStorage = class {
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
      privacyByUser = /* @__PURE__ */ new Map();
      presenceByUser = /* @__PURE__ */ new Map();
      memChatRooms = /* @__PURE__ */ new Map();
      memChatMembers = /* @__PURE__ */ new Map();
      memChatInvites = /* @__PURE__ */ new Map();
      memPinnedMessages = /* @__PURE__ */ new Map();
      memChatLikes = /* @__PURE__ */ new Set();
      memPrivateLikes = /* @__PURE__ */ new Set();
      memChatReactions = /* @__PURE__ */ new Map();
      memPrivateReactions = /* @__PURE__ */ new Map();
      memReadCursors = /* @__PURE__ */ new Map();
      memLegacyRoomsReady = false;
      memNotifications = /* @__PURE__ */ new Map();
      memPushSubs = /* @__PURE__ */ new Map();
      userTracksMap = /* @__PURE__ */ new Map();
      adminBroadcastsMap = /* @__PURE__ */ new Map();
      adminBroadcastDismissalsSet = /* @__PURE__ */ new Set();
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
            imageUrl: null,
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
            imageUrl: null,
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
            format: "post",
            expiresAt: null,
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
            format: "post",
            expiresAt: null,
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
            format: "post",
            expiresAt: null,
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
      async setUserAdmin(userId, isAdmin2) {
        const existing = this.users.get(userId);
        if (!existing) throw new Error("User not found");
        const user = { ...existing, isAdmin: isAdmin2, updatedAt: /* @__PURE__ */ new Date() };
        this.users.set(userId, user);
        return user;
      }
      async ensureAdminUsers() {
        const { getAdminEmails: getAdminEmails2 } = await Promise.resolve().then(() => (init_admin(), admin_exports));
        for (const email of Array.from(getAdminEmails2())) {
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
        const participantId = genId();
        this.tripParticipants.set(participantId, {
          id: participantId,
          tripId: id,
          userId: trip.userId,
          joinedAt: /* @__PURE__ */ new Date(),
          status: "confirmed"
        });
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
      async getTripWaypoint(waypointId) {
        return this.tripWaypoints.get(waypointId);
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
      async getFriendshipById(friendshipId) {
        return this.friendships.get(friendshipId);
      }
      // Friend operations
      async areFriends(userId1, userId2) {
        if (userId1 === userId2) return true;
        return Array.from(this.friendships.values()).some(
          (f) => f.status === "accepted" && (f.requesterId === userId1 && f.addresseeId === userId2 || f.requesterId === userId2 && f.addresseeId === userId1)
        );
      }
      async sendFriendRequest(requesterId, addresseeId, direction) {
        const id = genId();
        const friendship = {
          id,
          requesterId,
          addresseeId,
          status: "pending",
          direction: direction ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.friendships.set(id, friendship);
        return friendship;
      }
      async respondToFriendRequest(friendshipId, status, direction) {
        const friendship = this.friendships.get(friendshipId);
        if (!friendship) throw new Error("Friendship not found");
        const updated = {
          ...friendship,
          status,
          direction: direction && status === "accepted" ? direction : friendship.direction,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.friendships.set(friendshipId, updated);
        return updated;
      }
      async getFriends(userId, direction) {
        const friendIds = [];
        for (const f of Array.from(this.friendships.values())) {
          if (f.status === "accepted") {
            if (direction && f.direction !== direction) continue;
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
        const now = Date.now();
        let results = Array.from(this.travelPosts.values()).filter((p) => {
          if (p.format === "story" && p.expiresAt && new Date(p.expiresAt).getTime() <= now) {
            return false;
          }
          return true;
        });
        if (filters?.format) {
          results = results.filter((p) => (p.format ?? "post") === filters.format);
        }
        if (filters?.publicOnly) {
          results = results.filter(
            (p) => p.isPublic !== false && ["post", "journal"].includes(p.format ?? "post")
          );
        }
        if (filters?.userId) {
          results = results.filter((p) => p.userId === filters.userId);
        }
        if (filters?.following) {
          const followingIds = Array.from(this.userFollows.values()).filter((f) => f.followerId === filters.following).map((f) => f.followingId);
          const allowed = /* @__PURE__ */ new Set([filters.following, ...followingIds]);
          results = results.filter((p) => p.userId && allowed.has(p.userId));
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
      async searchUsers(query, limit = 10, options) {
        const q = query.toLowerCase().replace(/^@/, "");
        let list = Array.from(this.users.values());
        if (options?.exact) {
          list = list.filter((u) => u.username?.toLowerCase() === q);
        } else {
          list = list.filter(
            (u) => u.username?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q)
          );
        }
        return list.slice(0, limit);
      }
      async getPrivacySettings(userId) {
        return this.privacyByUser.get(userId) ?? {
          userId,
          ...DEFAULT_PRIVACY_SETTINGS,
          createdAt: null,
          updatedAt: null
        };
      }
      async updatePrivacySettings(userId, patch) {
        const current = await this.getPrivacySettings(userId);
        const merged = { ...current, ...patch, updatedAt: /* @__PURE__ */ new Date() };
        this.privacyByUser.set(userId, merged);
        return merged;
      }
      async touchPresence(userId, isOnline) {
        const row = { userId, isOnline, lastSeenAt: /* @__PURE__ */ new Date() };
        this.presenceByUser.set(userId, row);
        return row;
      }
      async getPresence(userId) {
        return this.presenceByUser.get(userId);
      }
      ensureMemLegacyRooms() {
        if (this.memLegacyRoomsReady) return;
        for (const seed of LEGACY_CHAT_ROOM_SEEDS) {
          const id = genId();
          const room = {
            id,
            slug: seed.slug,
            title: seed.title,
            description: seed.description,
            avatarUrl: null,
            visibility: "public",
            createdBy: null,
            settings: { autoJoinOnPost: true },
            isLegacy: true,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.memChatRooms.set(id, room);
        }
        this.memLegacyRoomsReady = true;
      }
      async ensureLegacyChatRooms() {
        this.ensureMemLegacyRooms();
      }
      async getChatRoomBySlug(slug) {
        this.ensureMemLegacyRooms();
        return Array.from(this.memChatRooms.values()).find((r) => r.slug === slug);
      }
      async getChatRoom(id) {
        return this.memChatRooms.get(id);
      }
      async listChatRoomsForUser(userId) {
        this.ensureMemLegacyRooms();
        return Array.from(this.memChatRooms.values()).filter((room) => {
          if (room.visibility === "private") {
            const my = Array.from(this.memChatMembers.values()).find(
              (m) => m.roomId === room.id && m.userId === userId && m.status === "active"
            );
            if (!my) return false;
          }
          return true;
        }).map((room) => {
          const cursor = this.memReadCursors.get(`${room.id}:${userId}`);
          let afterTime = null;
          if (cursor?.lastReadMessageId) {
            const readMsg = this.chatMessages.get(cursor.lastReadMessageId);
            if (readMsg?.createdAt) afterTime = new Date(readMsg.createdAt);
          }
          const unreadCount = Array.from(this.chatMessages.values()).filter((m) => {
            if (m.chatRoom !== room.slug || m.userId === userId) return false;
            if (!afterTime) return true;
            return m.createdAt && new Date(m.createdAt) > afterTime;
          }).length;
          return {
            ...room,
            memberCount: Array.from(this.memChatMembers.values()).filter(
              (m) => m.roomId === room.id && m.status === "active"
            ).length,
            myRole: Array.from(this.memChatMembers.values()).find(
              (m) => m.roomId === room.id && m.userId === userId
            )?.role ?? null,
            unreadCount
          };
        });
      }
      async createChatRoom(data) {
        const id = genId();
        const slug = data.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
        const room = {
          id,
          slug,
          title: data.title,
          description: data.description ?? null,
          avatarUrl: data.avatarUrl ?? null,
          visibility: data.visibility,
          createdBy: data.createdBy,
          settings: data.settings ?? {},
          isLegacy: false,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.memChatRooms.set(id, room);
        await this.joinChatRoom(id, data.createdBy, "owner");
        return room;
      }
      async updateChatRoom(id, patch) {
        const room = this.memChatRooms.get(id);
        if (!room) throw new Error("Room not found");
        const mergedSettings = patch.settings ? { ...room.settings ?? {}, ...patch.settings } : patch.settings;
        const updated = {
          ...room,
          ...patch,
          ...mergedSettings !== void 0 ? { settings: mergedSettings } : {},
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.memChatRooms.set(id, updated);
        return updated;
      }
      async getChatRoomMember(roomId, userId) {
        return Array.from(this.memChatMembers.values()).find((m) => m.roomId === roomId && m.userId === userId);
      }
      async joinChatRoom(roomId, userId, role = "member") {
        const existing = await this.getChatRoomMember(roomId, userId);
        if (existing) return { ...existing, status: "active" };
        const id = genId();
        const m = { id, roomId, userId, role, status: "active", joinedAt: /* @__PURE__ */ new Date() };
        this.memChatMembers.set(id, m);
        return m;
      }
      async leaveChatRoom(roomId, userId) {
        for (const [id, m] of Array.from(this.memChatMembers.entries())) {
          if (m.roomId === roomId && m.userId === userId) this.memChatMembers.delete(id);
        }
      }
      async getChatRoomMembers(roomId) {
        const members = Array.from(this.memChatMembers.values()).filter(
          (m) => m.roomId === roomId && m.status === "active"
        );
        return members.map((m) => ({ ...m, user: this.users.get(m.userId) })).filter((x) => x.user);
      }
      async setChatRoomMemberRole(roomId, userId, role) {
        const m = await this.getChatRoomMember(roomId, userId);
        if (!m) throw new Error("Member not found");
        const updated = { ...m, role };
        this.memChatMembers.set(m.id, updated);
        return updated;
      }
      async banChatRoomMember(roomId, userId) {
        const m = await this.getChatRoomMember(roomId, userId);
        if (m) this.memChatMembers.set(m.id, { ...m, status: "banned" });
      }
      async createChatRoomInvite(roomId, createdBy, opts) {
        const token = genId();
        const id = genId();
        const row = {
          id,
          roomId,
          token,
          createdBy,
          expiresAt: opts?.expiresAt ?? null,
          maxUses: opts?.maxUses ?? null,
          useCount: 0,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.memChatInvites.set(id, row);
        return { ...row, inviteUrl: `/chat/join/${token}` };
      }
      async joinChatRoomByToken(token, userId) {
        const invite = Array.from(this.memChatInvites.values()).find((i) => i.token === token);
        if (!invite) throw new Error("Invalid invite");
        const room = this.memChatRooms.get(invite.roomId);
        if (!room) throw new Error("Room not found");
        await this.joinChatRoom(room.id, userId);
        return room;
      }
      async getChatMessage(messageId) {
        return this.chatMessages.get(messageId);
      }
      async updateChatMessage(messageId, content) {
        const msg = this.chatMessages.get(messageId);
        if (!msg) return void 0;
        const updated = { ...msg, content, updatedAt: /* @__PURE__ */ new Date() };
        this.chatMessages.set(messageId, updated);
        return updated;
      }
      async getChatMessageLikeMeta(messageIds, viewerId) {
        const out = {};
        for (const id of messageIds) {
          const likes = Array.from(this.memChatLikes).filter((k) => k.startsWith(`${id}:`));
          out[id] = {
            likeCount: likes.length,
            likedByMe: this.memChatLikes.has(`${id}:${viewerId}`)
          };
        }
        return out;
      }
      async toggleChatMessageLike(messageId, userId) {
        const key = `${messageId}:${userId}`;
        if (this.memChatLikes.has(key)) this.memChatLikes.delete(key);
        else this.memChatLikes.add(key);
        const meta = await this.getChatMessageLikeMeta([messageId], userId);
        return meta[messageId] ?? { likeCount: 0, likedByMe: false };
      }
      async pinChatMessage(roomId, messageId, _pinnedBy) {
        this.memPinnedMessages.set(`${roomId}:${messageId}`, { roomId, messageId });
      }
      async unpinChatMessage(roomId, messageId) {
        this.memPinnedMessages.delete(`${roomId}:${messageId}`);
      }
      async getPinnedMessageIds(roomId) {
        return Array.from(this.memPinnedMessages.values()).filter((p) => p.roomId === roomId).map((p) => p.messageId);
      }
      async deleteChatMessage(messageId) {
        this.chatMessages.delete(messageId);
        for (const key of Array.from(this.memChatLikes)) {
          if (key.startsWith(`${messageId}:`)) this.memChatLikes.delete(key);
        }
      }
      async getPrivateMessage(messageId) {
        return this.privateMessages.get(messageId);
      }
      async updatePrivateMessage(messageId, content) {
        const msg = this.privateMessages.get(messageId);
        if (!msg) return void 0;
        const updated = { ...msg, content, updatedAt: /* @__PURE__ */ new Date() };
        this.privateMessages.set(messageId, updated);
        return updated;
      }
      async deletePrivateMessage(messageId) {
        this.privateMessages.delete(messageId);
        for (const key of Array.from(this.memPrivateLikes)) {
          if (key.startsWith(`${messageId}:`)) this.memPrivateLikes.delete(key);
        }
      }
      async getPrivateMessageLikeMeta(messageIds, viewerId) {
        const out = {};
        for (const id of messageIds) {
          const likes = Array.from(this.memPrivateLikes).filter((k) => k.startsWith(`${id}:`));
          out[id] = {
            likeCount: likes.length,
            likedByMe: this.memPrivateLikes.has(`${id}:${viewerId}`)
          };
        }
        return out;
      }
      async togglePrivateMessageLike(messageId, userId) {
        const key = `${messageId}:${userId}`;
        if (this.memPrivateLikes.has(key)) this.memPrivateLikes.delete(key);
        else this.memPrivateLikes.add(key);
        const meta = await this.getPrivateMessageLikeMeta([messageId], userId);
        return meta[messageId] ?? { likeCount: 0, likedByMe: false };
      }
      buildReactionsMeta(messageIds, viewerId, store) {
        const out = {};
        for (const id of messageIds) {
          const byEmoji = /* @__PURE__ */ new Map();
          for (const [key, emoji] of Array.from(store.entries())) {
            if (!key.startsWith(`${id}:`)) continue;
            const uid = key.slice(id.length + 1);
            const existing = byEmoji.get(emoji) ?? { count: 0, reactedByMe: false };
            existing.count += 1;
            if (uid === viewerId) existing.reactedByMe = true;
            byEmoji.set(emoji, existing);
          }
          out[id] = {
            reactions: Array.from(byEmoji.entries()).map(([emoji, v]) => ({ emoji, ...v }))
          };
        }
        return out;
      }
      async getChatMessageReactionsMeta(messageIds, viewerId) {
        return this.buildReactionsMeta(messageIds, viewerId, this.memChatReactions);
      }
      async setChatMessageReaction(messageId, userId, emoji) {
        const key = `${messageId}:${userId}`;
        if (!emoji) this.memChatReactions.delete(key);
        else this.memChatReactions.set(key, emoji);
        const meta = await this.getChatMessageReactionsMeta([messageId], userId);
        return meta[messageId] ?? { reactions: [] };
      }
      async getChatMessageReactionDetails(messageId) {
        const byEmoji = /* @__PURE__ */ new Map();
        for (const [key, emoji] of Array.from(this.memChatReactions.entries())) {
          if (!key.startsWith(`${messageId}:`)) continue;
          const uid = key.slice(messageId.length + 1);
          const user = this.users.get(uid);
          if (!user) continue;
          const list = byEmoji.get(emoji) ?? [];
          list.push(user);
          byEmoji.set(emoji, list);
        }
        return Array.from(byEmoji.entries()).map(([emoji, users2]) => ({ emoji, users: users2 }));
      }
      async upsertChatRoomReadCursor(roomId, userId, lastReadMessageId) {
        this.memReadCursors.set(`${roomId}:${userId}`, { lastReadMessageId, updatedAt: /* @__PURE__ */ new Date() });
      }
      async getChatMessageReaders(roomId, messageId, excludeUserId) {
        const msg = this.chatMessages.get(messageId);
        if (!msg?.createdAt) return [];
        const readers = [];
        for (const [key, cursor] of Array.from(this.memReadCursors.entries())) {
          if (!key.startsWith(`${roomId}:`)) continue;
          const uid = key.slice(roomId.length + 1);
          if (excludeUserId && uid === excludeUserId) continue;
          const readMsg = this.chatMessages.get(cursor.lastReadMessageId);
          if (readMsg?.createdAt && new Date(readMsg.createdAt) >= new Date(msg.createdAt)) {
            const user = this.users.get(uid);
            if (user) readers.push(user);
          }
        }
        return readers;
      }
      async getChatMessageReadMeta(roomId, messageIds, authorId) {
        const members = Array.from(this.memChatMembers.values()).filter(
          (m) => m.roomId === roomId && m.status === "active" && m.userId !== authorId
        );
        const memberCount = members.length;
        const out = {};
        for (const id of messageIds) {
          const msg = this.chatMessages.get(id);
          if (!msg?.createdAt) {
            out[id] = { deliveryStatus: "sent", readByCount: 0, memberCount };
            continue;
          }
          const msgTime = new Date(msg.createdAt);
          let readByCount = 0;
          let deliveredCount = 0;
          for (const member of members) {
            const cursor = this.memReadCursors.get(`${roomId}:${member.userId}`);
            if (!cursor) continue;
            deliveredCount += 1;
            const readMsg = this.chatMessages.get(cursor.lastReadMessageId);
            if (readMsg?.createdAt && new Date(readMsg.createdAt) >= msgTime) readByCount += 1;
          }
          let deliveryStatus = "sent";
          if (memberCount === 0) deliveryStatus = "delivered";
          else if (readByCount === memberCount) deliveryStatus = "read";
          else if (deliveredCount === memberCount || readByCount > 0) deliveryStatus = "delivered";
          out[id] = { deliveryStatus, readByCount, memberCount };
        }
        return out;
      }
      async getPrivateMessageReactionsMeta(messageIds, viewerId) {
        return this.buildReactionsMeta(messageIds, viewerId, this.memPrivateReactions);
      }
      async setPrivateMessageReaction(messageId, userId, emoji) {
        const key = `${messageId}:${userId}`;
        if (!emoji) this.memPrivateReactions.delete(key);
        else this.memPrivateReactions.set(key, emoji);
        const meta = await this.getPrivateMessageReactionsMeta([messageId], userId);
        return meta[messageId] ?? { reactions: [] };
      }
      async getPrivateMessageReactionDetails(messageId) {
        const byEmoji = /* @__PURE__ */ new Map();
        for (const [key, emoji] of Array.from(this.memPrivateReactions.entries())) {
          if (!key.startsWith(`${messageId}:`)) continue;
          const uid = key.slice(messageId.length + 1);
          const user = this.users.get(uid);
          if (!user) continue;
          const list = byEmoji.get(emoji) ?? [];
          list.push(user);
          byEmoji.set(emoji, list);
        }
        return Array.from(byEmoji.entries()).map(([emoji, users2]) => ({ emoji, users: users2 }));
      }
      async markPrivateMessagesDelivered(receiverId, senderId) {
        for (const [id, msg] of Array.from(this.privateMessages.entries())) {
          if (msg.receiverId === receiverId && msg.senderId === senderId && !msg.deliveredAt) {
            this.privateMessages.set(id, { ...msg, deliveredAt: /* @__PURE__ */ new Date() });
          }
        }
      }
      async createNotification(data) {
        const id = genId();
        const row = {
          id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          link: data.link ?? null,
          actorId: data.actorId ?? null,
          entityId: data.entityId ?? null,
          isRead: false,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.memNotifications.set(id, row);
        return row;
      }
      async getNotifications(userId, limit = 50) {
        return Array.from(this.memNotifications.values()).filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
      }
      async getUnreadNotificationCount(userId) {
        return Array.from(this.memNotifications.values()).filter(
          (n) => n.userId === userId && !n.isRead
        ).length;
      }
      async markNotificationRead(userId, id) {
        const n = this.memNotifications.get(id);
        if (n && n.userId === userId) this.memNotifications.set(id, { ...n, isRead: true });
      }
      async markAllNotificationsRead(userId) {
        for (const [id, n] of Array.from(this.memNotifications.entries())) {
          if (n.userId === userId) this.memNotifications.set(id, { ...n, isRead: true });
        }
      }
      async upsertPushSubscription(userId, sub) {
        this.memPushSubs.set(sub.endpoint, {
          userId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        });
      }
      async getPushSubscriptionsForUser(userId) {
        return Array.from(this.memPushSubs.values()).filter((s) => s.userId === userId);
      }
      async deletePushSubscription(endpoint) {
        this.memPushSubs.delete(endpoint);
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
      async deleteUserAccount(userId) {
        this.users.delete(userId);
        for (const [id, t] of Array.from(this.trips.entries())) {
          if (t.userId === userId) this.trips.delete(id);
        }
        for (const [id, p] of Array.from(this.tripParticipants.entries())) {
          if (p.userId === userId) this.tripParticipants.delete(id);
        }
        for (const [id, r] of Array.from(this.reviews.entries())) {
          if (r.userId === userId) this.reviews.delete(id);
        }
        for (const [id, m] of Array.from(this.chatMessages.entries())) {
          if (m.userId === userId) this.chatMessages.delete(id);
        }
        for (const [id, f] of Array.from(this.userFavorites.entries())) {
          if (f.userId === userId) this.userFavorites.delete(id);
        }
        this.userProfiles.delete(userId);
        for (const [id, f] of Array.from(this.friendships.entries())) {
          if (f.requesterId === userId || f.addresseeId === userId) this.friendships.delete(id);
        }
        for (const [id, f] of Array.from(this.userFollows.entries())) {
          if (f.followerId === userId || f.followingId === userId) this.userFollows.delete(id);
        }
        for (const [id, m] of Array.from(this.privateMessages.entries())) {
          if (m.senderId === userId || m.receiverId === userId) this.privateMessages.delete(id);
        }
        for (const [id, p] of Array.from(this.travelPosts.entries())) {
          if (p.userId === userId) this.travelPosts.delete(id);
        }
        for (const [id, l] of Array.from(this.postLikes.entries())) {
          if (l.userId === userId) this.postLikes.delete(id);
        }
        for (const [id, c] of Array.from(this.postComments.entries())) {
          if (c.userId === userId) this.postComments.delete(id);
        }
        for (const [id, r] of Array.from(this.eventRegistrations.entries())) {
          if (r.userId === userId) this.eventRegistrations.delete(id);
        }
      }
      async listUserTracks(userId) {
        return Array.from(this.userTracksMap.values()).filter((t) => t.userId === userId).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      }
      async getUserTrack(id) {
        return this.userTracksMap.get(id);
      }
      async createUserTrack(data) {
        const id = genId();
        const track = {
          id,
          userId: data.userId,
          title: data.title,
          fileUrl: data.fileUrl,
          mimeType: data.mimeType ?? null,
          fileSizeBytes: data.fileSizeBytes ?? null,
          durationSeconds: data.durationSeconds ?? null,
          artist: data.artist ?? null,
          sourceProvider: data.sourceProvider ?? null,
          sourceId: data.sourceId ?? null,
          license: data.license ?? null,
          isPreview: data.isPreview ?? false,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.userTracksMap.set(id, track);
        return track;
      }
      async deleteUserTrack(id) {
        this.userTracksMap.delete(id);
      }
      async createAdminBroadcast(data) {
        const id = genId();
        const row = {
          id,
          createdBy: data.createdBy,
          content: data.content,
          isActive: data.isActive ?? true,
          expiresAt: data.expiresAt ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.adminBroadcastsMap.set(id, row);
        return row;
      }
      async getAdminBroadcasts() {
        return Array.from(this.adminBroadcastsMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      async getPendingAdminBroadcast(userId) {
        const now = Date.now();
        return Array.from(this.adminBroadcastsMap.values()).filter((b) => {
          if (!b.isActive) return false;
          if (b.expiresAt && new Date(b.expiresAt).getTime() <= now) return false;
          if (this.adminBroadcastDismissalsSet.has(`${b.id}:${userId}`)) return false;
          return true;
        }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      }
      async dismissAdminBroadcast(broadcastId, userId, action) {
        this.adminBroadcastDismissalsSet.add(`${broadcastId}:${userId}`);
        void action;
      }
      async getAllUserIds() {
        return Array.from(this.users.keys());
      }
      async exportUserData(userId) {
        const user = this.users.get(userId);
        if (!user) throw new Error("User not found");
        const { passwordHash: _pw, ...userSafe } = user;
        return {
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          user: userSafe,
          profile: this.userProfiles.get(userId) ?? null,
          trips: await this.getUserTrips(userId),
          posts: await this.getTravelPosts({ userId }),
          reviews: await this.getReviewsByUser(userId),
          favorites: await this.getUserFavorites(userId)
        };
      }
    };
    storage = createStorage();
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
function inferNominatimKind(it) {
  const cls = it.class ?? "";
  const typ = it.type ?? "";
  if (cls === "boundary" && typ === "country") return "country";
  if (cls === "place" && ["city", "town", "village", "hamlet", "municipality"].includes(typ)) {
    return "city";
  }
  if (["amenity", "shop", "tourism", "leisure", "building", "craft"].includes(cls)) return "poi";
  return "address";
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
    kind: inferNominatimKind(it),
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

// server/media-storage.ts
var media_storage_exports = {};
__export(media_storage_exports, {
  VERCEL_BLOB_REQUIRED_MSG: () => VERCEL_BLOB_REQUIRED_MSG,
  blobDeliveryUrl: () => blobDeliveryUrl,
  getUploadsStaticDir: () => getUploadsStaticDir,
  hasBlobStorage: () => hasBlobStorage,
  isValidBlobDeliveryPathname: () => isValidBlobDeliveryPathname,
  persistUploadedFile: () => persistUploadedFile,
  putBlobBuffer: () => putBlobBuffer
});
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
function resolveUploadsDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "ait-uploads");
  }
  return path.resolve(process.cwd(), "uploads");
}
function getUploadsDir() {
  if (uploadsDir) return uploadsDir;
  uploadsDir = resolveUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
function guessExtension(mime, originalName) {
  const fromName = originalName ? path.extname(originalName) : "";
  if (fromName) return fromName.toLowerCase();
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav"
  };
  return map[mime] ?? ".bin";
}
function fileBuffer(file) {
  if (file.buffer?.length) return file.buffer;
  if (file.path && fs.existsSync(file.path)) return fs.readFileSync(file.path);
  throw new Error("Empty upload");
}
function isPrivateStoreError(message) {
  return /private store|private access/i.test(message);
}
function hasBlobStorage() {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (!storeId) return false;
  if (process.env.VERCEL) return true;
  return Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());
}
function blobDeliveryUrl(pathname) {
  return `/api/media/blob?pathname=${encodeURIComponent(pathname)}`;
}
function isValidBlobDeliveryPathname(pathname) {
  if (!pathname || pathname.includes("..") || pathname.startsWith("/")) return false;
  return pathname.startsWith("media/") || pathname.startsWith("music/");
}
async function putBlobBuffer(key, buffer, mime) {
  const baseOpts = { contentType: mime, addRandomSuffix: false };
  const accessEnv = process.env.BLOB_ACCESS?.trim().toLowerCase();
  if (accessEnv === "private") {
    const blob = await put(key, buffer, { ...baseOpts, access: "private" });
    return blobDeliveryUrl(blob.pathname);
  }
  if (accessEnv === "public") {
    const blob = await put(key, buffer, { ...baseOpts, access: "public" });
    return blob.url;
  }
  try {
    const blob = await put(key, buffer, { ...baseOpts, access: "public" });
    return blob.url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!isPrivateStoreError(msg)) throw e;
    const blob = await put(key, buffer, { ...baseOpts, access: "private" });
    return blobDeliveryUrl(blob.pathname);
  }
}
async function persistUploadedFile(file) {
  const buffer = fileBuffer(file);
  const mime = file.mimetype || "application/octet-stream";
  const ext = guessExtension(mime, file.originalname);
  if (hasBlobStorage()) {
    const key = `media/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    return putBlobBuffer(key, buffer, mime);
  }
  if (!process.env.VERCEL) {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    fs.writeFileSync(path.join(getUploadsDir(), filename), buffer);
    return `/uploads/${filename}`;
  }
  throw new Error(VERCEL_BLOB_REQUIRED_MSG);
}
function getUploadsStaticDir() {
  return getUploadsDir();
}
var VERCEL_BLOB_REQUIRED_MSG, uploadsDir;
var init_media_storage = __esm({
  "server/media-storage.ts"() {
    "use strict";
    VERCEL_BLOB_REQUIRED_MSG = "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0430 Vercel \u0442\u0440\u0435\u0431\u0443\u0435\u0442 Vercel Blob: Storage \u2192 Blob \u2192 Connect to Project (\u043E\u0434\u0438\u043D store). \u0414\u043E\u043B\u0436\u043D\u044B \u043F\u043E\u044F\u0432\u0438\u0442\u044C\u0441\u044F BLOB_STORE_ID (OIDC) \u0438\u043B\u0438 BLOB_READ_WRITE_TOKEN. BLOB_WEBHOOK_PUBLIC_KEY \u2014 \u043D\u0435 \u0434\u043B\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043E\u043A. \u041F\u043E\u0441\u043B\u0435 redeploy \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442. \u041B\u0438\u043C\u0438\u0442 \u0442\u0435\u043B\u0430 ~4.5 \u041C\u0411.";
    uploadsDir = null;
  }
});

// server/geo/photon.ts
function buildLabel(p) {
  const parts = [
    p.name,
    p.street ? [p.street, p.housenumber].filter(Boolean).join(" ") : null,
    p.city,
    p.state,
    p.country
  ].filter(Boolean);
  return Array.from(new Set(parts)).join(", ");
}
function inferKind(p) {
  const key = p.osm_key ?? "";
  const val = p.osm_value ?? "";
  if (key === "place" && ["city", "town", "village", "hamlet", "municipality"].includes(val)) {
    return "city";
  }
  if (key === "boundary" && val === "country") return "country";
  if (["amenity", "shop", "tourism", "leisure", "building"].includes(key)) return "poi";
  return "address";
}
async function photonAutocomplete(params) {
  const q = params.q.trim();
  const limit = Math.max(1, Math.min(15, Math.floor(params.limit)));
  if (q.length < 2) return [];
  const url = new URL(BASE);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", (params.lang ?? "ru").split(",")[0] || "ru");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) {
    throw new Error(`Photon error: ${res.status}`);
  }
  const json = await res.json();
  const features = Array.isArray(json.features) ? json.features : [];
  const out = [];
  for (const f of features) {
    const p = f.properties;
    const coords = f.geometry?.coordinates;
    if (!p) continue;
    const label = buildLabel(p);
    if (!label) continue;
    out.push({
      label,
      kind: inferKind(p),
      lat: coords?.[1] ?? null,
      lon: coords?.[0] ?? null,
      city: p.city ?? null,
      country: p.country ?? null
    });
    if (out.length >= limit) break;
  }
  return out;
}
var BASE;
var init_photon = __esm({
  "server/geo/photon.ts"() {
    "use strict";
    BASE = "https://photon.komoot.io/api/";
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
import { and as and4, desc as desc4, eq as eq4, ilike as ilike3, or as or3 } from "drizzle-orm";
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
    }).from(countries).where(or3(ilike3(countries.name, pattern), ilike3(countries.code, q.toUpperCase()))).limit(limit);
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
    }).from(cities).leftJoin(countries, eq4(cities.countryCode, countries.code)).where(
      and4(
        or3(ilike3(cities.name, pattern), ilike3(cities.asciiName, pattern)),
        // keep only valid country codes
        ilike3(cities.countryCode, "__")
      )
    ).orderBy(desc4(cities.population), cities.name).limit(remaining);
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
  return Math.max(1, Math.min(15, Math.floor(limit)));
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
  const limit = clampLimit2(params.limit ?? 10);
  const scope = params.scope ?? "all";
  const lang = params.acceptLanguage ?? "ru";
  const results = [];
  const remaining = () => Math.max(0, limit - results.length);
  const useFull = scope === "full" || scope === "all";
  if (useFull && remaining() > 0) {
    try {
      const photon = await photonAutocomplete({ q, limit: remaining(), lang });
      mergeUnique(results, photon, limit);
    } catch (e) {
      console.warn("Photon autocomplete failed.", e);
    }
  }
  if (remaining() > 0 && isAnyYandexGeoConfigured()) {
    try {
      const ya = await yandexAutocomplete({ q, limit: remaining(), acceptLanguage: lang });
      mergeUnique(
        results,
        ya.map((item) => ({ ...item, kind: item.kind ?? "address" })),
        limit
      );
    } catch (e) {
      console.warn("Yandex autocomplete failed.", e);
    }
  }
  if (useFull && remaining() > 0) {
    try {
      const nom = await nominatimAutocomplete({ q, limit: remaining(), acceptLanguage: lang });
      mergeUnique(results, nom, limit);
    } catch (e) {
      console.warn("Nominatim autocomplete failed.", e);
    }
  }
  if (scope !== "full" && process.env.DATABASE_URL && remaining() > 0) {
    try {
      const dbScope = scope === "country" ? "country" : scope === "city" ? "city" : "all";
      const dbItems = await dbGeoAutocomplete({ q, limit: remaining(), scope: dbScope });
      mergeUnique(results, dbItems.map(dbItemToGeo), limit);
    } catch (e) {
      console.warn("DB geo autocomplete failed.", e);
    }
  }
  if (!useFull && remaining() > 0) {
    const nom = await nominatimAutocomplete({ q, limit: remaining(), acceptLanguage: lang });
    mergeUnique(results, nom, limit);
  }
  return results;
}
var init_resolve_autocomplete = __esm({
  "server/geo/resolve-autocomplete.ts"() {
    "use strict";
    init_nominatim();
    init_photon();
    init_yandex_config();
    init_yandex();
    init_db_autocomplete();
  }
});

// server/geo/nominatim-poi.ts
var nominatim_poi_exports = {};
__export(nominatim_poi_exports, {
  allowGeoRequest: () => allowGeoRequest,
  nominatimPoiSearch: () => nominatimPoiSearch
});
function shortName(displayName) {
  const first = displayName.split(",")[0]?.trim();
  return first || displayName;
}
function inferPlaceType(osmType, osmClass) {
  const t = (osmType ?? "").toLowerCase();
  if (["hotel", "motel", "hostel", "guest_house"].includes(t)) return "hotel";
  if (["restaurant", "cafe", "fast_food", "food_court", "bar", "pub"].includes(t)) return "restaurant";
  if (["museum", "attraction", "viewpoint", "theme_park", "gallery"].includes(t)) return "attraction";
  if (osmClass === "tourism") return "attraction";
  if (osmClass === "amenity" && t.includes("restaurant")) return "restaurant";
  return "attraction";
}
function buildPoiQuery(q, filterType) {
  const trimmed = q.trim();
  if (!trimmed) return "";
  const mapped = filterType && filterType !== "all" ? TYPE_TO_OSM[filterType] : null;
  if (mapped && !trimmed.toLowerCase().includes(mapped)) {
    return `${mapped} ${trimmed}`;
  }
  return trimmed;
}
async function nominatimPoiSearch(params) {
  const q = buildPoiQuery(params.q, params.filterType);
  if (q.length < 2) return [];
  const limit = Math.max(1, Math.min(25, Math.floor(params.limit ?? 15)));
  const lang = (params.acceptLanguage ?? "").trim();
  const cacheKey = `poi:v1:${q.toLowerCase()}:${limit}:${params.lat ?? ""}:${params.lon ?? ""}:${params.filterType ?? ""}`;
  const cached = cache3.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const url = new URL(BASE_URL2);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit * 2));
  url.searchParams.set("dedupe", "1");
  if (params.lat != null && params.lon != null && Number.isFinite(params.lat) && Number.isFinite(params.lon)) {
    const d = 0.35;
    const minLon = params.lon - d;
    const maxLon = params.lon + d;
    const minLat = params.lat - d;
    const maxLat = params.lat + d;
    url.searchParams.set("viewbox", `${minLon},${maxLat},${maxLon},${minLat}`);
    url.searchParams.set("bounded", "1");
  }
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT2,
      ...lang ? { "Accept-Language": lang } : {}
    }
  });
  if (!res.ok) {
    throw new Error(`Nominatim POI error: ${res.status}`);
  }
  const json = await res.json();
  const rows = (Array.isArray(json) ? json : []).filter((it) => {
    const cls = it.class ?? "";
    if (POI_CLASSES.has(cls)) return true;
    const t = (it.type ?? "").toLowerCase();
    return ["restaurant", "hotel", "cafe", "fast_food", "museum", "attraction"].includes(t);
  }).filter((it) => it.lat && it.lon).sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0)).slice(0, limit);
  const items = rows.map((it) => {
    const osmId = it.osm_id ?? it.place_id ?? Math.random();
    const placeType = inferPlaceType(it.type, it.class);
    return {
      id: `osm-${it.osm_type ?? "node"}-${osmId}`,
      name: shortName(it.display_name ?? q),
      latitude: it.lat,
      longitude: it.lon,
      type: placeType,
      address: it.display_name ?? null,
      source: "osm"
    };
  });
  cache3.set(cacheKey, { data: items, expiresAt: Date.now() + 3 * 60 * 60 * 1e3 });
  return items;
}
var BASE_URL2, USER_AGENT2, POI_CLASSES, TYPE_TO_OSM, cache3;
var init_nominatim_poi = __esm({
  "server/geo/nominatim-poi.ts"() {
    "use strict";
    init_nominatim();
    BASE_URL2 = "https://nominatim.openstreetmap.org/search";
    USER_AGENT2 = "All-in-travel/1.0 (poi search)";
    POI_CLASSES = /* @__PURE__ */ new Set(["amenity", "shop", "tourism", "leisure", "office", "craft", "building"]);
    TYPE_TO_OSM = {
      hotel: "hotel",
      restaurant: "restaurant",
      attraction: "attraction",
      tour: "travel_agency"
    };
    cache3 = /* @__PURE__ */ new Map();
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

// server/trip-validation.ts
var trip_validation_exports = {};
__export(trip_validation_exports, {
  createTripBodySchema: () => createTripBodySchema,
  parseCreateTripBody: () => parseCreateTripBody
});
import { z as z5 } from "zod";
function parseCreateTripBody(body, userId) {
  return createTripBodySchema.parse({ ...body, userId });
}
var optionalBudget, createTripBodySchema;
var init_trip_validation = __esm({
  "server/trip-validation.ts"() {
    "use strict";
    init_schema();
    optionalBudget = z5.preprocess(
      (v) => v === "" || v === null || v === void 0 || Number.isNaN(Number(v)) ? void 0 : Number(v),
      z5.number().int().min(0).optional()
    );
    createTripBodySchema = insertTripSchema.extend({
      startDate: z5.coerce.date(),
      endDate: z5.coerce.date(),
      budgetMin: optionalBudget,
      budgetMax: optionalBudget
    }).refine((data) => data.endDate >= data.startDate, {
      message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043D\u0435 \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430",
      path: ["endDate"]
    });
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
import helmet from "helmet";

// server/routes.ts
init_storage();
init_auth();
init_google_auth();
init_nominatim();
init_schema();
init_username();
init_privacy();
import { createServer } from "http";
import passport3 from "passport";
import { z as z6 } from "zod";
import path2 from "path";
import fs2 from "fs";

// shared/travel-directions.ts
var TRAVEL_DIRECTIONS = [
  { id: "europe", label: "\u0415\u0432\u0440\u043E\u043F\u0430" },
  { id: "asia", label: "\u0410\u0437\u0438\u044F" },
  { id: "america", label: "\u0410\u043C\u0435\u0440\u0438\u043A\u0430" },
  { id: "africa", label: "\u0410\u0444\u0440\u0438\u043A\u0430" },
  { id: "oceania", label: "\u041E\u043A\u0435\u0430\u043D\u0438\u044F" },
  { id: "middle_east", label: "\u0411\u043B\u0438\u0436\u043D\u0438\u0439 \u0412\u043E\u0441\u0442\u043E\u043A" },
  { id: "local", label: "\u0420\u044F\u0434\u043E\u043C / \u043F\u043E \u0441\u0442\u0440\u0430\u043D\u0435" }
];
var TRAVEL_DIRECTION_IDS = new Set(TRAVEL_DIRECTIONS.map((d) => d.id));
function isTravelDirectionId(value) {
  return TRAVEL_DIRECTION_IDS.has(value);
}

// server/routes.ts
init_user_utils();
init_media_storage();

// server/upload.ts
init_auth();
init_storage();
init_media_storage();
import { Readable } from "node:stream";
import express from "express";
import multer, { MulterError } from "multer";
import { get } from "@vercel/blob";
var ALLOWED_MIME = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "audio/mp3"
]);
function isAllowedMime(mime, originalName) {
  if (ALLOWED_MIME.has(mime)) return true;
  const lower = originalName.toLowerCase();
  if (mime === "application/octet-stream") {
    if (lower.endsWith(".gif")) return true;
    if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) return true;
    if (lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".ogg") || lower.endsWith(".wav") || lower.endsWith(".webm"))
      return true;
  }
  return false;
}
function createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (isAllowedMime(file.mimetype, file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error("\u0414\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B \u0444\u043E\u0442\u043E, \u0432\u0438\u0434\u0435\u043E MP4/WebM \u0438 \u0430\u0443\u0434\u0438\u043E MP3/M4A/OGG/WAV"));
      }
    }
  });
}
function handleMulter(req, res, next, middleware) {
  middleware(req, res, (err) => {
    if (!err) return next();
    if (err instanceof MulterError) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? process.env.VERCEL ? "\u0424\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 (\u043D\u0430 Vercel \u043B\u0438\u043C\u0438\u0442 ~4.5 \u041C\u0411 \u043D\u0430 \u043E\u0434\u0438\u043D \u0437\u0430\u043F\u0440\u043E\u0441)" : "\u0424\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 (\u043C\u0430\u043A\u0441. 50 \u041C\u0411)" : err.message;
      return res.status(400).json({ message: msg });
    }
    const message = err instanceof Error ? err.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438";
    return res.status(400).json({ message });
  });
}
function mountUploadRoutes(app, options) {
  const upload = createUploadMiddleware();
  const serveStatic2 = options?.serveStatic !== false;
  if (serveStatic2) {
    const dir = getUploadsStaticDir();
    app.use("/uploads", express.static(dir));
  }
  app.get("/api/media/blob", async (req, res) => {
    const pathname = typeof req.query.pathname === "string" ? req.query.pathname : "";
    if (!isValidBlobDeliveryPathname(pathname)) {
      return res.status(400).json({ message: "Invalid pathname" });
    }
    try {
      const result = await get(pathname, { access: "private" });
      if (result?.statusCode !== 200 || !result.stream) {
        return res.status(404).end();
      }
      res.setHeader("Content-Type", result.blob.contentType);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=86400");
      Readable.fromWeb(result.stream).pipe(res);
    } catch (e) {
      console.error("[blob-delivery]", e);
      res.status(500).json({ message: "Failed to load file" });
    }
  });
  app.post(
    "/api/upload",
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D" });
        }
        const url = await persistUploadedFile(req.file);
        res.json({ url });
      } catch (e) {
        const message = e instanceof Error ? e.message : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0444\u0430\u0439\u043B";
        console.error("[upload]", message);
        res.status(500).json({ message });
      }
    }
  );
  app.post(
    "/api/users/avatar",
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D" });
        }
        const mime = req.file.mimetype || "";
        if (!mime.startsWith("image/")) {
          return res.status(400).json({ message: "\u0410\u0432\u0430\u0442\u0430\u0440 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C (JPG, PNG, WebP, GIF)" });
        }
        const userId = req.user.claims.sub;
        const url = await persistUploadedFile(req.file);
        const existing = await storage.getUser(userId);
        if (existing) {
          await storage.upsertUser({ ...existing, profileImageUrl: url });
        }
        res.json({ url });
      } catch (e) {
        const message = e instanceof Error ? e.message : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440";
        console.error("[avatar]", message);
        res.status(500).json({ message });
      }
    }
  );
  mountRoomAvatarRoute(app, upload);
}
async function isRoomAdminForUpload(roomId, userId) {
  const member = await storage.getChatRoomMember(roomId, userId);
  return member?.role === "admin" || member?.role === "owner";
}
function mountRoomAvatarRoute(app, upload) {
  app.post(
    "/api/chat/rooms/:id/avatar",
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, upload.single("file")),
    async (req, res) => {
      try {
        const userId = req.user.claims.sub;
        const roomId = req.params.id;
        if (!await isRoomAdminForUpload(roomId, userId)) {
          return res.status(403).json({ message: "Admin only" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D" });
        }
        const mime = req.file.mimetype || "";
        if (!mime.startsWith("image/")) {
          return res.status(400).json({ message: "\u0410\u0432\u0430\u0442\u0430\u0440 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C (JPG, PNG, WebP, GIF)" });
        }
        const url = await persistUploadedFile(req.file);
        if (url.startsWith("data:")) {
          return res.status(500).json({ message: VERCEL_BLOB_REQUIRED_MSG });
        }
        const room = await storage.updateChatRoom(roomId, { avatarUrl: url });
        res.json({ url, room });
      } catch (e) {
        const message = e instanceof Error ? e.message : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440";
        console.error("[room-avatar]", message);
        res.status(500).json({ message });
      }
    }
  );
}
function setupUploadRoutes(app) {
  mountUploadRoutes(app);
}

// server/routes.ts
init_security();

// server/chat-access.ts
async function resolveChatRoomAccess(storage2, roomSlug, userId) {
  const normalized = roomSlug.trim().slice(0, 100);
  if (!normalized || normalized.includes("..")) {
    return { allowed: false, reason: "Invalid room" };
  }
  const room = await storage2.getChatRoomBySlug(normalized);
  if (!room) return { allowed: false, reason: "Room not found" };
  if (!userId) {
    return { allowed: false, reason: "Authentication required" };
  }
  const member = await storage2.getChatRoomMember(room.id, userId);
  if (room.visibility === "private") {
    if (!member || member.status === "banned") {
      return { allowed: false, reason: "Private room \u2014 invite required" };
    }
  } else {
    if (member?.status === "banned") {
      return { allowed: false, reason: "Banned from room" };
    }
  }
  const settings = room.settings ?? {};
  const whoCanPost = settings.whoCanPost ?? "everyone";
  const isMember = Boolean(member && member.status === "active");
  const isAdmin2 = member?.role === "admin" || member?.role === "owner";
  let canPost = false;
  if (whoCanPost === "everyone") {
    canPost = room.visibility === "public" ? true : isMember;
  } else {
    canPost = isMember;
  }
  if (isAdmin2) canPost = true;
  return { allowed: true, room, canPost };
}
async function ensureMemberForPost(storage2, room, userId) {
  const member = await storage2.getChatRoomMember(room.id, userId);
  if (member?.status === "active") return;
  if (room.visibility === "private") {
    throw new Error("Not a member");
  }
  const autoJoin = room.settings?.autoJoinOnPost !== false;
  if (autoJoin) {
    await storage2.joinChatRoom(room.id, userId, "member");
  }
}

// server/chat-media-content.ts
var MEDIA_TOKEN_RE = /\[(gif|sticker|image|video|audio|voice):([^\]]+)\]/g;
var ALLOWED_HOSTS = [
  "public.blob.vercel-storage.com",
  "blob.vercel-storage.com",
  "media.giphy.com",
  "i.giphy.com",
  "giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com"
];
function hostAllowed(hostname) {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}
function isSafeServerMediaUrl(url) {
  if (!url?.trim()) return false;
  if (url.startsWith("/stickers/")) return true;
  if (url.startsWith("/api/media/blob?")) return true;
  if (!process.env.VERCEL && url.startsWith("/uploads/")) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") {
      return hostAllowed(parsed.hostname);
    }
    return false;
  } catch {
    return false;
  }
}
function extractMediaUrls(content) {
  const urls = [];
  const re = new RegExp(MEDIA_TOKEN_RE.source, "g");
  let match;
  while ((match = re.exec(content)) !== null) {
    const kind = match[1];
    const inner = match[2];
    if (kind === "voice") {
      const pipeIdx = inner.lastIndexOf("|");
      urls.push(pipeIdx === -1 ? inner : inner.slice(0, pipeIdx));
    } else {
      urls.push(inner);
    }
  }
  return urls;
}
function validateChatMessageMediaContent(content) {
  const urls = extractMediaUrls(content);
  for (const url of urls) {
    if (!isSafeServerMediaUrl(url)) {
      return "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 URL \u043C\u0435\u0434\u0438\u0430 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0438";
    }
  }
  return null;
}

// server/music-search.ts
function getJamendoClientId() {
  return process.env.JAMENDO_CLIENT_ID?.trim() || void 0;
}
async function searchJamendoTracks(query, limit = 8) {
  const clientId = getJamendoClientId();
  if (!clientId || query.trim().length < 2) return [];
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: String(limit),
    namesearch: query.trim(),
    audioformat: "mp32"
  });
  const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []).filter((t) => t.audiodownload || t.audio).map((t) => ({
    source: "jamendo",
    id: String(t.id),
    title: t.name,
    artist: t.artist_name,
    durationSeconds: Math.round(Number(t.duration) || 0),
    license: t.license_ccurl ?? null,
    downloadUrl: t.audiodownload ?? t.audio ?? "",
    streamUrl: t.audio ?? t.audiodownload ?? ""
  }));
}
async function searchItunesTracks(query, limit = 8) {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({
    term: query.trim(),
    media: "music",
    entity: "song",
    limit: String(limit),
    country: "RU"
  });
  const res = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []).filter((t) => t.previewUrl).map((t) => ({
    source: "itunes",
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    durationSeconds: Math.round((t.trackTimeMillis ?? 0) / 1e3),
    previewUrl: t.previewUrl,
    trackViewUrl: t.trackViewUrl ?? "",
    album: t.collectionName ?? null
  }));
}
async function searchMusicCatalog(query) {
  const [jamendo, itunes] = await Promise.all([
    searchJamendoTracks(query),
    searchItunesTracks(query)
  ]);
  return { jamendo, itunes };
}
async function getJamendoTrackById(trackId) {
  const clientId = getJamendoClientId();
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    id: trackId,
    audioformat: "mp32"
  });
  const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
  if (!res.ok) return null;
  const json = await res.json();
  const t = json.results?.[0];
  if (!t || !(t.audiodownload || t.audio)) return null;
  return {
    source: "jamendo",
    id: String(t.id),
    title: t.name,
    artist: t.artist_name,
    durationSeconds: Math.round(Number(t.duration) || 0),
    license: t.license_ccurl ?? null,
    downloadUrl: t.audiodownload ?? t.audio ?? "",
    streamUrl: t.audio ?? t.audiodownload ?? ""
  };
}
function isJamendoDownloadUrl(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.endsWith("jamendo.com") || h.endsWith("jamendo.net");
  } catch {
    return false;
  }
}
async function importJamendoTrackToBlob(trackId) {
  const track = await getJamendoTrackById(trackId);
  if (!track) throw new Error("\u0422\u0440\u0435\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 Jamendo");
  const downloadUrl = track.downloadUrl;
  if (!isJamendoDownloadUrl(downloadUrl)) {
    throw new Error("\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 URL \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438");
  }
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0442\u0440\u0435\u043A");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > 50 * 1024 * 1024) throw new Error("\u0424\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439");
  const mimeType = res.headers.get("content-type") || "audio/mpeg";
  let fileUrl;
  const { hasBlobStorage: hasBlobStorage2, putBlobBuffer: putBlobBuffer2 } = await Promise.resolve().then(() => (init_media_storage(), media_storage_exports));
  if (hasBlobStorage2()) {
    const key = `music/jamendo-${trackId}-${Date.now()}.mp3`;
    fileUrl = await putBlobBuffer2(key, buffer, mimeType);
  } else if (!process.env.VERCEL) {
    const fs3 = await import("fs");
    const path3 = await import("path");
    const { getUploadsStaticDir: getUploadsStaticDir2 } = await Promise.resolve().then(() => (init_media_storage(), media_storage_exports));
    const filename = `jamendo-${trackId}-${Date.now()}.mp3`;
    fs3.writeFileSync(path3.join(getUploadsStaticDir2(), filename), buffer);
    fileUrl = `/uploads/${filename}`;
  } else {
    throw new Error("\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 Vercel Blob \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043C\u0443\u0437\u044B\u043A\u0438");
  }
  return {
    fileUrl,
    title: track.title.slice(0, 200),
    artist: track.artist.slice(0, 200),
    license: track.license,
    durationSeconds: track.durationSeconds,
    mimeType,
    fileSizeBytes: buffer.length,
    sourceId: track.id
  };
}
async function getItunesTrackById(trackId) {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&country=RU`);
  if (!res.ok) return null;
  const json = await res.json();
  const t = json.results?.[0];
  if (!t?.previewUrl) return null;
  return {
    source: "itunes",
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    durationSeconds: Math.round((t.trackTimeMillis ?? 0) / 1e3),
    previewUrl: t.previewUrl,
    trackViewUrl: t.trackViewUrl ?? "",
    album: t.collectionName ?? null
  };
}

// server/routes.ts
init_privacy_helpers();

// server/post-validation.ts
init_schema();
import { z as z4 } from "zod";

// shared/post-formats.ts
import { z as z3 } from "zod";
var POST_FORMATS = ["post", "story", "reel", "journal"];
var postFormatSchema = z3.enum(POST_FORMATS);
function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes("/video/");
}
function defaultTitleForFormat(format) {
  switch (format) {
    case "story":
      return "Story";
    case "reel":
      return "Reel";
    case "journal":
      return "Journal";
    default:
      return "Post";
  }
}

// server/post-validation.ts
var STORY_TTL_MS = 24 * 60 * 60 * 1e3;
function parseCreateTravelPostBody(body, userId) {
  const base = insertTravelPostSchema.parse({ ...body, userId });
  const format = postFormatSchema.parse(body?.format ?? "post");
  const images = base.images ?? [];
  const content = (base.content ?? "").trim();
  const title = (base.title ?? "").trim() || defaultTitleForFormat(format);
  if (format === "story") {
    if (!images.length) {
      throw new z4.ZodError([
        {
          code: "custom",
          path: ["images"],
          message: "Story requires at least one image or video"
        }
      ]);
    }
    return {
      ...base,
      format,
      title,
      content: content || " ",
      expiresAt: new Date(Date.now() + STORY_TTL_MS)
    };
  }
  if (format === "reel") {
    if (!images.some(isVideoUrl)) {
      throw new z4.ZodError([
        {
          code: "custom",
          path: ["images"],
          message: "Reel requires a video file"
        }
      ]);
    }
    return { ...base, format, title, content: content || " " };
  }
  if (format === "journal") {
    if (content.length < 80) {
      throw new z4.ZodError([
        {
          code: "custom",
          path: ["content"],
          message: "Journal entry should be at least 80 characters"
        }
      ]);
    }
    return {
      ...base,
      format,
      title,
      isPublic: base.isPublic ?? true
    };
  }
  if (!title || title.length < 2) {
    throw new z4.ZodError([
      { code: "custom", path: ["title"], message: "Title is required" }
    ]);
  }
  if (!content) {
    throw new z4.ZodError([
      { code: "custom", path: ["content"], message: "Content is required" }
    ]);
  }
  return { ...base, format, title, content };
}

// server/routes.ts
init_notification_service();
init_realtime_hub();
var updateUserMeSchema = z6.object({
  displayName: z6.string().max(64).nullable().optional(),
  firstName: z6.string().max(100).nullable().optional(),
  lastName: z6.string().max(100).nullable().optional(),
  username: z6.string().optional()
});
async function registerRoutes(app) {
  await setupAuth(app);
  app.get("/api/geo/autocomplete", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const limitRaw = req.query.limit != null ? Number(req.query.limit) : 8;
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(15, Math.floor(limitRaw))) : 10;
      const scopeRaw = typeof req.query.scope === "string" ? req.query.scope : "all";
      const scope = scopeRaw === "city" || scopeRaw === "country" || scopeRaw === "all" || scopeRaw === "full" ? scopeRaw : "all";
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
  app.get("/api/map/pois", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const type = typeof req.query.type === "string" ? req.query.type : void 0;
      const latRaw = req.query.lat != null ? Number(req.query.lat) : NaN;
      const lonRaw = req.query.lon != null ? Number(req.query.lon) : NaN;
      const lat = Number.isFinite(latRaw) ? latRaw : void 0;
      const lon = Number.isFinite(lonRaw) ? lonRaw : void 0;
      if (q.length < 2) {
        return res.json({ places: [] });
      }
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const { allowGeoRequest: allowPoi } = await Promise.resolve().then(() => (init_nominatim_poi(), nominatim_poi_exports));
      if (!allowPoi(`poi:${ip}`)) {
        return res.status(429).json({ message: "Too many requests" });
      }
      const acceptLanguage = req.headers["accept-language"] ?? (typeof req.query.lang === "string" ? req.query.lang : void 0);
      const segments = q.split(/[,;]|(?:\s+—\s+)|(?:\s+–\s+)|(?:\s+-\s+)/).map((s) => s.trim()).filter(Boolean);
      const keywords = segments.length >= 2 ? segments[segments.length - 1] : q;
      const locationHint = segments.length >= 2 ? segments.slice(0, -1).join(", ") : q;
      const catalogTerms = [keywords, locationHint, q].filter(
        (t, i, arr) => t.length >= 2 && arr.indexOf(t) === i
      );
      const catalogBatches = await Promise.all(
        catalogTerms.map(
          (term) => storage.getPlaces({
            search: term,
            type: type && type !== "all" ? type : void 0,
            limit: 20
          })
        )
      );
      const catalogMap = /* @__PURE__ */ new Map();
      for (const batch of catalogBatches) {
        for (const p of batch) {
          catalogMap.set(p.id, p);
        }
      }
      const { nominatimPoiSearch: nominatimPoiSearch2 } = await Promise.resolve().then(() => (init_nominatim_poi(), nominatim_poi_exports));
      const osmPlaces = await nominatimPoiSearch2({
        q: keywords.length >= 2 ? keywords : q,
        limit: 20,
        lat,
        lon,
        filterType: type,
        acceptLanguage
      });
      const merged = [
        ...Array.from(catalogMap.values()),
        ...osmPlaces.filter((o) => !catalogMap.has(o.id))
      ].slice(0, 40);
      res.json({ places: merged });
    } catch (error) {
      console.error("Error searching map POIs:", error);
      res.status(500).json({ message: "Failed to search places on map" });
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
        const { count: count4 } = await import("drizzle-orm");
        const [c1] = await db2.select({ value: count4() }).from(countriesTable);
        const [c2] = await db2.select({ value: count4() }).from(citiesTable);
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
      if (error instanceof z6.ZodError) {
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
      const viewerId = req.isAuthenticated() ? req.user.claims.sub : void 0;
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
        isOnline: showOnline ? presence?.isOnline ?? false : void 0,
        lastSeenAt: showOnline && settings.showLastSeen ? presence?.lastSeenAt : void 0,
        isFriend
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
      const sessionUser = req.isAuthenticated() ? req.user : void 0;
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
  app.get("/api/settings/privacy", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getPrivacySettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      res.status(500).json({ message: "Failed to fetch privacy settings" });
    }
  });
  app.put("/api/settings/privacy", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = updatePrivacySettingsSchema.parse(req.body);
      const settings = await storage.updatePrivacySettings(userId, body);
      res.json(settings);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid privacy settings", errors: error.errors });
      }
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });
  app.post("/api/presence/heartbeat", isAuthenticated, async (req, res) => {
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
      if (error instanceof z6.ZodError) {
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
      if (error instanceof z6.ZodError) {
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
      const userId = req.user.claims.sub;
      if (!await userCanManageTrip(storage, userId, req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
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
  app.post("/api/trips/:id/waypoints/from-location", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!await userCanManageTrip(storage, userId, req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const label = String(req.body?.label ?? "").trim();
      const lat = Number(req.body?.lat);
      const lon = Number(req.body?.lon);
      if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0430\u0434\u0440\u0435\u0441 \u0438 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B" });
      }
      const name = label.split(",")[0]?.trim() || label;
      const candidates = await storage.getPlaces({ search: name, limit: 10 });
      let place = candidates.find((p) => {
        const plat = Number(p.latitude);
        const plon = Number(p.longitude);
        return Number.isFinite(plat) && Number.isFinite(plon) && Math.abs(plat - lat) < 0.08 && Math.abs(plon - lon) < 0.08;
      });
      if (!place) {
        place = await storage.createPlace({
          name,
          type: "attraction",
          latitude: String(lat),
          longitude: String(lon),
          address: label,
          description: "\u0422\u043E\u0447\u043A\u0430 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430"
        });
      }
      const waypoint = await storage.addTripWaypoint(
        req.params.id,
        place.id,
        req.body.orderIndex != null ? Number(req.body.orderIndex) : void 0,
        req.body.dayNumber != null ? Number(req.body.dayNumber) : void 0
      );
      res.status(201).json({ waypoint, place });
    } catch (error) {
      console.error("Error adding waypoint from location:", error);
      res.status(500).json({ message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443" });
    }
  });
  app.patch("/api/trips/:id/waypoints/:waypointId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!await userCanManageTrip(storage, userId, req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const existingWp = await storage.getTripWaypoint(req.params.waypointId);
      if (!existingWp || existingWp.tripId !== req.params.id) {
        return res.status(404).json({ message: "Waypoint not found" });
      }
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
      const userId = req.user.claims.sub;
      if (!await userCanManageTrip(storage, userId, req.params.id)) {
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
  app.post("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { parseCreateTripBody: parseCreateTripBody2 } = await Promise.resolve().then(() => (init_trip_validation(), trip_validation_exports));
      const tripData = parseCreateTripBody2(req.body, userId);
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        const first = error.errors[0]?.message ?? "Invalid trip data";
        return res.status(400).json({ message: first, errors: error.errors });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });
  app.post("/api/trips/:id/join", isAuthenticated, async (req, res) => {
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
      if (error instanceof z6.ZodError) {
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
  app.get("/api/trips/:id/participants", isAuthenticated, async (req, res) => {
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
            user: raw ? toPublicUser(raw) : null
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });
  app.get("/api/music/tracks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const tracks = await storage.listUserTracks(userId);
      res.json(tracks);
    } catch (error) {
      console.error("Error listing music tracks:", error);
      res.status(500).json({ message: "Failed to list tracks" });
    }
  });
  app.post("/api/music/tracks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = insertUserTrackSchema.parse({ ...req.body, userId });
      const track = await storage.createUserTrack(body);
      res.status(201).json(track);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid track data", errors: error.errors });
      }
      console.error("Error creating music track:", error);
      res.status(500).json({ message: "Failed to create track" });
    }
  });
  app.get("/api/music/search", isAuthenticated, async (req, res) => {
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
  const importTrackSchema = z6.object({
    source: z6.enum(["jamendo", "itunes"]),
    externalId: z6.string().min(1).max(100)
  });
  app.post("/api/music/tracks/import", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = importTrackSchema.parse(req.body);
      if (body.source === "jamendo") {
        const imported = await importJamendoTrackToBlob(body.externalId);
        const track2 = await storage.createUserTrack({
          userId,
          title: imported.title,
          fileUrl: imported.fileUrl,
          mimeType: imported.mimeType,
          fileSizeBytes: imported.fileSizeBytes,
          durationSeconds: imported.durationSeconds,
          artist: imported.artist,
          sourceProvider: "jamendo",
          sourceId: imported.sourceId,
          license: imported.license ?? void 0,
          isPreview: false
        });
        return res.status(201).json(track2);
      }
      const itunes = await getItunesTrackById(body.externalId);
      if (!itunes) return res.status(404).json({ message: "\u0422\u0440\u0435\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      const track = await storage.createUserTrack({
        userId,
        title: itunes.title.slice(0, 200),
        fileUrl: itunes.previewUrl,
        mimeType: "audio/mpeg",
        durationSeconds: 30,
        artist: itunes.artist.slice(0, 200),
        sourceProvider: "itunes",
        sourceId: itunes.id,
        isPreview: true
      });
      res.status(201).json(track);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error importing music track:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to import track"
      });
    }
  });
  app.delete("/api/music/tracks/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/music/tracks/:id/download", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const track = await storage.getUserTrack(req.params.id);
      if (!track) return res.status(404).json({ message: "Track not found" });
      if (track.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      const ext = path2.extname(track.fileUrl) || ".mp3";
      const safeTitle = track.title.replace(/[^\w\s.-]/g, "").trim() || "track";
      const filename = `${safeTitle}${ext}`;
      if (track.fileUrl.startsWith("/uploads/")) {
        const localPath = path2.join(getUploadsStaticDir(), path2.basename(track.fileUrl));
        if (!fs2.existsSync(localPath)) {
          return res.status(404).json({ message: "File not found" });
        }
        return res.download(localPath, filename);
      }
      const remote = await fetch(track.fileUrl);
      if (!remote.ok) {
        return res.status(502).json({ message: "Failed to fetch file" });
      }
      const buffer = Buffer.from(await remote.arrayBuffer());
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Type", track.mimeType || remote.headers.get("content-type") || "audio/mpeg");
      res.send(buffer);
    } catch (error) {
      console.error("Error downloading music track:", error);
      res.status(500).json({ message: "Failed to download track" });
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
      const [receivedRequests, conversations, dbItems, unreadNotifs] = await Promise.all([
        storage.getFriendRequests(userId, "received"),
        storage.getConversations(userId),
        storage.getNotifications(userId, 40),
        storage.getUnreadNotificationCount(userId)
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
          createdAt: n.createdAt?.toISOString() ?? null
        }))
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markNotificationRead(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });
  app.put("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking all read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });
  app.post("/api/admin/broadcasts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = z6.object({
        content: z6.string().min(1).max(8e3),
        expiresAt: z6.coerce.date().optional()
      }).parse(req.body);
      validateChatMessageMediaContent(body.content);
      const broadcast = await storage.createAdminBroadcast({
        createdBy: userId,
        content: body.content,
        isActive: true,
        expiresAt: body.expiresAt ?? null
      });
      const { broadcastToUser: broadcastToUser2 } = await Promise.resolve().then(() => (init_realtime_hub(), realtime_hub_exports));
      const userIds = await storage.getAllUserIds();
      for (const uid of userIds) {
        broadcastToUser2(uid, {
          type: "broadcast_published",
          broadcast: {
            id: broadcast.id,
            content: broadcast.content,
            createdAt: broadcast.createdAt?.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      res.status(201).json(broadcast);
    } catch (error) {
      if (error instanceof z6.ZodError) {
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
  app.get("/api/broadcasts/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const broadcast = await storage.getPendingAdminBroadcast(userId);
      res.json(broadcast ?? null);
    } catch (error) {
      console.error("Error fetching pending broadcast:", error);
      res.status(500).json({ message: "Failed to fetch broadcast" });
    }
  });
  app.post("/api/broadcasts/:id/dismiss", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = z6.object({ action: z6.enum(["ack", "skip_video"]) }).parse(req.body);
      await storage.dismissAdminBroadcast(req.params.id, userId, body.action);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid dismiss action", errors: error.errors });
      }
      console.error("Error dismissing broadcast:", error);
      res.status(500).json({ message: "Failed to dismiss broadcast" });
    }
  });
  const avatarUrlSchema = z6.string().max(2048).refine((u) => !u.startsWith("data:"), { message: "Data URLs are not allowed" }).optional();
  const createRoomSchema = z6.object({
    title: z6.string().min(1).max(120),
    description: z6.string().max(2e3).optional(),
    avatarUrl: avatarUrlSchema,
    visibility: z6.enum(["public", "private"]),
    slug: z6.string().max(100).optional()
  });
  const patchRoomSchema = createRoomSchema.partial().extend({
    settings: z6.object({
      slowModeSeconds: z6.number().int().min(0).max(3600).optional(),
      whoCanInvite: z6.enum(["everyone", "admins"]).optional(),
      whoCanPost: z6.enum(["everyone", "members"]).optional(),
      autoJoinOnPost: z6.boolean().optional(),
      chatBackground: z6.enum(["default", "aurora", "ocean", "sunset", "forest", "midnight", "lavender"]).optional()
    }).optional()
  });
  const isRoomAdmin = async (roomId, userId) => {
    const room = await storage.getChatRoom(roomId);
    if (room?.createdBy === userId) return true;
    const m = await storage.getChatRoomMember(roomId, userId);
    return m?.status === "active" && (m.role === "admin" || m.role === "owner");
  };
  app.get("/api/chat/rooms", isAuthenticated, async (req, res) => {
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
  const roomAvatarUpload = createUploadMiddleware();
  async function saveRoomAvatarFromFile(file) {
    const mime = file.mimetype || "";
    if (!mime.startsWith("image/")) {
      throw new Error("\u0410\u0432\u0430\u0442\u0430\u0440 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C (JPG, PNG, WebP, GIF)");
    }
    const url = await persistUploadedFile(file);
    if (url.startsWith("data:")) {
      throw new Error(VERCEL_BLOB_REQUIRED_MSG);
    }
    return url;
  }
  app.post(
    "/api/chat/rooms",
    isAuthenticated,
    (req, res, next) => handleMulter(req, res, next, roomAvatarUpload.single("file")),
    async (req, res) => {
      try {
        const userId = req.user.claims.sub;
        const body = createRoomSchema.parse({
          title: req.body?.title,
          description: req.body?.description || void 0,
          visibility: req.body?.visibility,
          avatarUrl: req.body?.avatarUrl,
          slug: req.body?.slug
        });
        let avatarUrl = body.avatarUrl;
        let avatarWarning;
        if (req.file) {
          try {
            avatarUrl = await saveRoomAvatarFromFile(req.file);
          } catch (e) {
            avatarWarning = e instanceof Error ? e.message : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440";
          }
        }
        const room = await storage.createChatRoom({
          title: body.title,
          description: body.description,
          avatarUrl,
          visibility: body.visibility,
          ...body.slug ? { slug: body.slug } : {},
          createdBy: userId
        });
        res.status(201).json({ room, ...avatarWarning ? { avatarWarning } : {} });
      } catch (error) {
        if (error instanceof z6.ZodError) {
          return res.status(400).json({ message: "Invalid room data", errors: error.errors });
        }
        console.error("Error creating chat room:", error);
        res.status(500).json({ message: "Failed to create room" });
      }
    }
  );
  app.get("/api/chat/rooms/:id", isAuthenticated, async (req, res) => {
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
  app.patch("/api/chat/rooms/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!await isRoomAdmin(req.params.id, userId)) {
        return res.status(403).json({ message: "Admin only" });
      }
      const patch = patchRoomSchema.parse(req.body);
      const room = await storage.updateChatRoom(req.params.id, patch);
      res.json(room);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Failed to update room" });
    }
  });
  app.post("/api/chat/rooms/:id/join", isAuthenticated, async (req, res) => {
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
  app.post("/api/chat/rooms/:id/leave", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leaveChatRoom(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });
  app.post("/api/chat/rooms/:id/invite", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!await isRoomAdmin(req.params.id, userId)) {
        return res.status(403).json({ message: "Admin only" });
      }
      const invite = await storage.createChatRoomInvite(req.params.id, userId);
      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });
  app.post("/api/chat/join/:token", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.joinChatRoomByToken(req.params.token, userId);
      const joiner = await storage.getUser(userId);
      if (joiner) {
        const members = await storage.getChatRoomMembers(room.id);
        const adminIds = members.filter((m) => m.role === "owner" || m.role === "admin").map((m) => m.userId);
        void notifyGroupJoin(adminIds, joiner, room.title, room.slug);
      }
      res.json(room);
    } catch (error) {
      console.error("Error joining by token:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to join" });
    }
  });
  app.get("/api/chat/rooms/:id/members", isAuthenticated, async (req, res) => {
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
  app.post("/api/chat/rooms/:id/members", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = req.params.id;
      if (!await isRoomAdmin(roomId, userId)) {
        return res.status(403).json({ message: "Admin only" });
      }
      const body = z6.object({ userId: z6.string().min(1) }).parse(req.body);
      const room = await storage.getChatRoom(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const target = await storage.getUser(body.userId);
      if (!target) return res.status(404).json({ message: "User not found" });
      const member = await storage.joinChatRoom(roomId, body.userId);
      res.status(201).json({ ...member, user: toPublicUser(target) });
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding room member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });
  app.patch("/api/chat/rooms/:id/members/:memberUserId", isAuthenticated, async (req, res) => {
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
      const body = z6.object({ role: z6.enum(["admin", "member"]) }).parse(req.body);
      const updated = await storage.setChatRoomMemberRole(roomId, memberUserId, body.role);
      res.json(updated);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });
  app.delete("/api/chat/rooms/:id/members/:memberUserId", isAuthenticated, async (req, res) => {
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
      if (!isSelf && !await isRoomAdmin(roomId, userId)) {
        return res.status(403).json({ message: "Admin only" });
      }
      await storage.banChatRoomMember(roomId, memberUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing room member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });
  const canManageChatMessage = async (roomId, messageId, userId) => {
    const msg = await storage.getChatMessage(messageId);
    if (!msg) return { ok: false, status: 404, message: "Message not found" };
    if (msg.userId === userId) return { ok: true, msg };
    if (await isRoomAdmin(roomId, userId)) return { ok: true, msg };
    return { ok: false, status: 403, message: "Forbidden" };
  };
  app.post("/api/chat/rooms/:roomId/messages/:messageId/pin", isAuthenticated, async (req, res) => {
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
        const preview = access.msg.content.replace(/\[[^\]]+\]/g, "").trim() || "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435";
        void notifyChatMessagePinned(memberIds, pinner, room.title, room.slug, req.params.messageId, preview);
        const { broadcastToUser: broadcastToUser2 } = await Promise.resolve().then(() => (init_realtime_hub(), realtime_hub_exports));
        for (const m of members) {
          broadcastToUser2(m.userId, {
            type: "message_pinned",
            roomId: req.params.roomId,
            roomSlug: room.slug,
            messageId: req.params.messageId
          });
        }
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error pinning message:", error);
      res.status(500).json({ message: "Failed to pin" });
    }
  });
  app.delete("/api/chat/rooms/:roomId/messages/:messageId/pin", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const access = await canManageChatMessage(req.params.roomId, req.params.messageId, userId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });
      await storage.unpinChatMessage(req.params.roomId, req.params.messageId);
      const room = await storage.getChatRoom(req.params.roomId);
      if (room) {
        const { broadcastToUser: broadcastToUser2 } = await Promise.resolve().then(() => (init_realtime_hub(), realtime_hub_exports));
        const members = await storage.getChatRoomMembers(req.params.roomId);
        for (const m of members) {
          broadcastToUser2(m.userId, {
            type: "message_unpinned",
            roomId: req.params.roomId,
            roomSlug: room.slug,
            messageId: req.params.messageId
          });
        }
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error unpinning message:", error);
      res.status(500).json({ message: "Failed to unpin" });
    }
  });
  app.delete("/api/chat/rooms/:roomId/messages/:messageId", isAuthenticated, async (req, res) => {
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
  app.patch("/api/chat/rooms/:roomId/messages/:messageId", isAuthenticated, async (req, res) => {
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
        sender: sender ? toPublicUser(sender) : null
      });
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid content", errors: error.errors });
      }
      console.error("Error editing message:", error);
      res.status(500).json({ message: "Failed to edit" });
    }
  });
  app.post("/api/chat/rooms/:roomId/messages/:messageId/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getChatMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const existing = await storage.getChatMessageReactionsMeta([req.params.messageId], userId);
      const mine = existing[req.params.messageId]?.reactions.find((r) => r.reactedByMe);
      const meta = await storage.setChatMessageReaction(
        req.params.messageId,
        userId,
        mine?.emoji === "\u2764\uFE0F" ? null : "\u2764\uFE0F"
      );
      res.json(meta);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });
  app.put("/api/chat/rooms/:roomId/messages/:messageId/reactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getChatMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const body = z6.object({ emoji: z6.string().min(1).max(16).nullable() }).parse(req.body);
      const meta = await storage.setChatMessageReaction(req.params.messageId, userId, body.emoji);
      const { broadcastToUser: broadcastToUser2 } = await Promise.resolve().then(() => (init_realtime_hub(), realtime_hub_exports));
      const members = await storage.getChatRoomMembers(req.params.roomId);
      for (const m of members) {
        if (m.userId !== userId) {
          broadcastToUser2(m.userId, {
            type: "reaction_updated",
            roomId: req.params.roomId,
            messageId: req.params.messageId,
            reactions: meta.reactions
          });
        }
      }
      res.json(meta);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid reaction", errors: error.errors });
      }
      console.error("Error setting reaction:", error);
      res.status(500).json({ message: "Failed to set reaction" });
    }
  });
  app.get("/api/chat/rooms/:roomId/messages/:messageId/insights", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.getChatRoom(req.params.roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const access = await resolveChatRoomAccess(storage, room.slug, userId);
      if (!access.allowed) return res.status(403).json({ message: access.reason });
      const msg = await storage.getChatMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const readers = await storage.getChatMessageReaders(room.id, req.params.messageId, msg.userId ?? void 0);
      const reactionGroups = await storage.getChatMessageReactionDetails(req.params.messageId);
      res.json({
        readCount: readers.length,
        readers: readers.map(toPublicUser),
        reactions: reactionGroups.map((g) => ({
          emoji: g.emoji,
          users: g.users.map(toPublicUser)
        }))
      });
    } catch (error) {
      console.error("Error fetching message insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });
  app.post("/api/chat/rooms/:roomId/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = req.params.roomId;
      const room = await storage.getChatRoom(roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const access = await resolveChatRoomAccess(storage, room.slug, userId);
      if (!access.allowed) return res.status(403).json({ message: access.reason });
      const body = z6.object({ messageId: z6.string().uuid() }).parse(req.body);
      await storage.upsertChatRoomReadCursor(roomId, userId, body.messageId);
      const { broadcastToUser: broadcastToUser2 } = await Promise.resolve().then(() => (init_realtime_hub(), realtime_hub_exports));
      const members = await storage.getChatRoomMembers(roomId);
      for (const m of members) {
        if (m.userId !== userId) {
          broadcastToUser2(m.userId, {
            type: "read_cursor_updated",
            roomId,
            userId,
            messageId: body.messageId
          });
        }
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating read cursor:", error);
      res.status(500).json({ message: "Failed to update read cursor" });
    }
  });
  const enrichChatMessages = async (messages, viewerId, roomId) => {
    const ids = messages.map((m) => m.id).filter(Boolean);
    const reactionMeta = await storage.getChatMessageReactionsMeta(ids, viewerId);
    const ownIds = messages.filter((m) => m.userId === viewerId && m.id).map((m) => m.id);
    const readMeta = roomId && ownIds.length > 0 ? await storage.getChatMessageReadMeta(roomId, ownIds, viewerId) : {};
    return Promise.all(
      messages.map(async (msg) => {
        const sender = msg.userId ? await storage.getUser(msg.userId) : null;
        const reactions = reactionMeta[msg.id] ?? { reactions: [] };
        const read = msg.id && msg.userId === viewerId ? readMeta[msg.id] : void 0;
        return {
          ...msg,
          ...reactions,
          ...read ?? {},
          sender: sender ? toPublicUser(sender) : null
        };
      })
    );
  };
  app.get("/api/chat/:room", isAuthenticated, async (req, res) => {
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
  app.post("/api/chat/:room", isAuthenticated, async (req, res) => {
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
      const userId = req.params.userId;
      const viewerId = req.isAuthenticated() ? req.user.claims.sub : void 0;
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
          updatedAt: null
        });
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
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = updateUserProfileSchema.parse(req.body);
      const profile = await storage.updateUserProfile(userId, profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app.post("/api/friends/request/:userId", isAuthenticated, async (req, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const addresseeId = req.params.userId;
      const targetSettings = await storage.getPrivacySettings(addresseeId);
      const isFriend = await storage.areFriends(requesterId, addresseeId);
      if (!canSendFriendRequest(targetSettings, requesterId, addresseeId, isFriend)) {
        return res.status(403).json({ message: "User does not accept friend requests" });
      }
      const direction = typeof req.body?.direction === "string" && isTravelDirectionId(req.body.direction) ? req.body.direction : void 0;
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
  app.put("/api/friends/respond/:friendshipId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = z6.enum(["accepted", "rejected"]).parse(req.body?.status);
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
      const direction = typeof req.body?.direction === "string" && isTravelDirectionId(req.body.direction) ? req.body.direction : void 0;
      const friendship = await storage.respondToFriendRequest(req.params.friendshipId, status, direction);
      if (status === "accepted") {
        const accepter = await storage.getUser(userId);
        if (accepter) {
          void notifyFriendAccepted(storage, friendship.requesterId, accepter, friendship.id);
        }
      }
      res.json(friendship);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid status" });
      }
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });
  app.get("/api/friends", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const direction = typeof req.query.direction === "string" && isTravelDirectionId(req.query.direction) ? req.query.direction : void 0;
      const friends = await storage.getFriends(userId, direction);
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
      const sender = await storage.getUser(senderId);
      if (sender) {
        void notifyNewMessage(receiverId, sender, message.content);
      }
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z6.ZodError) {
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
      await storage.markPrivateMessagesDelivered(currentUserId, otherUserId);
      const messages = await storage.getPrivateMessages(currentUserId, otherUserId, Number(limit));
      const ids = messages.map((m) => m.id).filter(Boolean);
      const reactionMeta = await storage.getPrivateMessageReactionsMeta(ids, currentUserId);
      res.json(
        messages.map((m) => {
          const reactions = reactionMeta[m.id] ?? { reactions: [] };
          const deliveryStatus = m.senderId === currentUserId ? m.isRead ? "read" : m.deliveredAt ? "delivered" : "sent" : void 0;
          return {
            ...m,
            ...reactions,
            ...deliveryStatus ? { deliveryStatus } : {}
          };
        })
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app.patch("/api/messages/:messageId", isAuthenticated, async (req, res) => {
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
        ...likeMeta[req.params.messageId] ?? { reactions: [] }
      });
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid content", errors: error.errors });
      }
      console.error("Error editing private message:", error);
      res.status(500).json({ message: "Failed to edit" });
    }
  });
  app.delete("/api/messages/:messageId", isAuthenticated, async (req, res) => {
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
  app.post("/api/messages/:messageId/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const existing = await storage.getPrivateMessageReactionsMeta([req.params.messageId], userId);
      const mine = existing[req.params.messageId]?.reactions.find((r) => r.reactedByMe);
      const meta = await storage.setPrivateMessageReaction(
        req.params.messageId,
        userId,
        mine?.emoji === "\u2764\uFE0F" ? null : "\u2764\uFE0F"
      );
      res.json(meta);
    } catch (error) {
      console.error("Error toggling private like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });
  app.put("/api/messages/:messageId/reactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const msg = await storage.getPrivateMessage(req.params.messageId);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const body = z6.object({ emoji: z6.string().min(1).max(16).nullable() }).parse(req.body);
      const meta = await storage.setPrivateMessageReaction(req.params.messageId, userId, body.emoji);
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (partnerId) {
        const { broadcastToUser: broadcastToUser2 } = await Promise.resolve().then(() => (init_realtime_hub(), realtime_hub_exports));
        broadcastToUser2(partnerId, {
          type: "reaction_updated",
          messageId: req.params.messageId,
          reactions: meta.reactions
        });
      }
      res.json(meta);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid reaction", errors: error.errors });
      }
      console.error("Error setting private reaction:", error);
      res.status(500).json({ message: "Failed to set reaction" });
    }
  });
  app.get("/api/messages/:messageId/insights", isAuthenticated, async (req, res) => {
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
          users: g.users.map(toPublicUser)
        }))
      });
    } catch (error) {
      console.error("Error fetching private message insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
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
              isOnline: showOnline ? presence?.isOnline ?? false : void 0
            }
          };
        })
      );
      res.json(enriched);
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
      const postData = parseCreateTravelPostBody(req.body, userId);
      const post = await storage.createTravelPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  app.get("/api/posts", async (req, res) => {
    try {
      const { userId, following, tag, format, public: publicFilter, limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?.claims?.sub || null;
      const posts = await storage.getTravelPosts({
        userId,
        following,
        tag,
        format,
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
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          profileImageUrl: author.profileImageUrl
        } : null
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
      const postData = updateTravelPostSchema.parse(req.body);
      const post = await storage.updateTravelPost(req.params.id, postData);
      res.json(post);
    } catch (error) {
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
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
      if (error instanceof z6.ZodError) {
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
  app.get("/api/account/export", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = await storage.exportUserData(userId);
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="all-in-travel-export-${userId}.json"`
      );
      res.json(data);
    } catch (error) {
      console.error("Error exporting account:", error);
      res.status(500).json({ message: "Failed to export account data" });
    }
  });
  app.delete("/api/account", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserAccount(userId);
      req.logout((err) => {
        if (err) console.error("Logout after account delete:", err);
        res.status(204).send();
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  app.get("/api/search/users", async (req, res) => {
    try {
      const { q, limit = 20, exact, direction, travelStyle } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const viewerId = req.isAuthenticated() ? req.user.claims.sub : void 0;
      const users2 = await storage.searchUsers(q, Number(limit), {
        viewerId,
        exact: exact === "1" || exact === "true",
        direction: typeof direction === "string" && isTravelDirectionId(direction) ? direction : void 0,
        travelStyle: typeof travelStyle === "string" ? travelStyle : void 0
      });
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
          passport3.initialize()(req, {}, () => {
            passport3.session()(req, {}, cb);
          });
        });
      };
      runSession(() => {
        const user = req.user;
        authenticatedUserId = user?.claims?.sub ?? null;
        if (authenticatedUserId) {
          registerUserSocket(authenticatedUserId, ws);
          storage.touchPresence(authenticatedUserId, true).catch(() => {
          });
        }
      });
      ws.on("close", () => {
        if (authenticatedUserId) {
          unregisterUserSocket(authenticatedUserId, ws);
          storage.touchPresence(authenticatedUserId, false).catch(() => {
          });
        }
      });
      ws.on("message", async (message) => {
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
              chatRoom
            });
            const savedMessage = await storage.createChatMessage(messageData);
            if (userId) await storage.touchPresence(userId, true);
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
    });
  }
  return httpServer;
}

// server/createApp.ts
init_storage();
init_push();
init_security();
var INIT_TIMEOUT_MS = 12e3;
async function createApp() {
  const app = express2();
  app.use(
    helmet({
      contentSecurityPolicy: isProductionEnv() ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          mediaSrc: ["'self'", "blob:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "data:", "https:"]
        }
      } : false
    })
  );
  app.use(express2.json());
  app.use(express2.urlencoded({ extended: false }));
  app.get("/api/health", async (_req, res) => {
    let database = false;
    if (process.env.DATABASE_URL) {
      try {
        const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const db2 = getDb2();
        if (db2) {
          const { sql: sql5 } = await import("drizzle-orm");
          await Promise.race([
            db2.execute(sql5`SELECT 1`),
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5e3))
          ]);
          database = true;
        }
      } catch {
        database = false;
      }
    }
    res.json({ ok: true, database });
  });
  app.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path3.startsWith("/api")) {
        let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(redactForLog(capturedJsonResponse))}`;
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

// server/vercel/auth-app.ts
init_auth_middleware();
init_local_auth();
import express3 from "express";
var authApp = null;
function getAuthApp() {
  if (authApp) return authApp;
  const app = express3();
  app.set("trust proxy", 1);
  app.use(express3.json());
  app.use(express3.urlencoded({ extended: false }));
  applyPassportMiddleware(app);
  registerLocalPassportStrategy();
  registerLoginRoutes(app);
  authApp = app;
  return app;
}
function isAuthLoginPath(method, url) {
  if (method !== "POST" || !url) return false;
  const path3 = url.split("?")[0] ?? "";
  return path3 === "/api/login" || path3 === "/api/auth/login";
}
function runAuthApp(req, res) {
  const app = getAuthApp();
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

// server/vercel/media-upload-app.ts
init_auth();
import express4 from "express";
var uploadApp = null;
function getMediaUploadApp() {
  if (uploadApp) return uploadApp;
  const app = express4();
  app.set("trust proxy", 1);
  applyPassportMiddleware(app);
  mountUploadRoutes(app, { serveStatic: false });
  uploadApp = app;
  return app;
}
function isMediaUploadPath(method, url) {
  if (method !== "POST" || !url) return false;
  const path3 = url.split("?")[0] ?? "";
  if (path3 === "/api/upload" || path3 === "/api/users/avatar") return true;
  return /^\/api\/chat\/rooms\/[^/]+\/avatar$/.test(path3);
}
function runMediaUploadApp(req, res) {
  const app = getMediaUploadApp();
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
    if (process.env.VERCEL && isAuthLoginPath(req.method, req.url)) {
      await runAuthApp(req, res);
      return;
    }
    if (process.env.VERCEL && isMediaUploadPath(req.method, req.url)) {
      await runMediaUploadApp(req, res);
      return;
    }
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api] unhandled error:", detail);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
export {
  config,
  handler as default
};
