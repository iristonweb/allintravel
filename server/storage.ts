import {
  type User,
  type UpsertUser,
  type Place,
  type InsertPlace,
  type Review,
  type InsertReview,
  type Trip,
  type InsertTrip,
  type TripParticipant,
  type TripWaypoint,
  type InsertTripWaypoint,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type ChatMessage,
  type InsertChatMessage,
  type UserFavorite,
  type UserProfile,
  type InsertUserProfile,
  type Friendship,
  type InsertFriendship,
  type UserFollow,
  type InsertUserFollow,
  type PrivateMessage,
  type InsertPrivateMessage,
  type TravelPost,
  type InsertTravelPost,
  type PostLike,
  type InsertPostLike,
  type PostComment,
  type InsertPostComment,
  type ChatRoom,
  type ChatRoomMember,
  type ChatRoomInvite,
  type UserPresence,
} from "@shared/schema";
// ChatRoom used in MemStorage in-memory maps
import type { UserPrivacySettings } from "@shared/privacy";
import { DEFAULT_PRIVACY_SETTINGS } from "@shared/privacy";
import { LEGACY_CHAT_ROOM_SEEDS } from "./legacy-chat-rooms";
import { getDb, isDatabaseConfigured } from "./db";
import { PgStorage } from "./pg-storage";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserMe(
    userId: string,
    data: {
      displayName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string;
    },
  ): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  setUserPassword(userId: string, passwordHash: string): Promise<User>;
  setUserAdmin(userId: string, isAdmin: boolean): Promise<User>;
  ensureAdminUsers?(): Promise<void>;
  ensureUsernames?(): Promise<void>;
  ensureSchema?(): Promise<void>;

  getPlaces(filters?: {
    type?: string;
    search?: string;
    minRating?: number;
    priceRange?: string;
    limit?: number;
    offset?: number;
  }): Promise<Place[]>;
  getPlace(id: string): Promise<Place | undefined>;
  createPlace(place: InsertPlace): Promise<Place>;
  updatePlace(id: string, place: Partial<InsertPlace>): Promise<Place>;

  getReviewsByPlace(placeId: string): Promise<Review[]>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updatePlaceRating(placeId: string): Promise<void>;

  getTrips(filters?: {
    userId?: string;
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  joinTrip(tripId: string, userId: string): Promise<TripParticipant>;
  getTripParticipants(tripId: string): Promise<TripParticipant[]>;
  getTripParticipationsByUser(userId: string): Promise<string[]>;
  getTripWaypoints(tripId: string): Promise<(TripWaypoint & { place: Place | null })[]>;
  addTripWaypoint(tripId: string, placeId: string, orderIndex?: number, dayNumber?: number): Promise<TripWaypoint>;
  getTripWaypoint(waypointId: string): Promise<TripWaypoint | undefined>;
  updateTripWaypoint(waypointId: string, data: { orderIndex?: number; dayNumber?: number }): Promise<TripWaypoint | undefined>;
  removeTripWaypoint(waypointId: string): Promise<void>;

  getEvents(filters?: {
    type?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  registerForEvent(eventId: string, userId: string): Promise<EventRegistration>;
  unregisterFromEvent(eventId: string, userId: string): Promise<void>;
  getRegisteredEventIds(userId: string): Promise<string[]>;
  isRegisteredForEvent(eventId: string, userId: string): Promise<boolean>;

  getChatMessages(chatRoom: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  getUserFavorites(userId: string): Promise<UserFavorite[]>;
  addFavorite(userId: string, placeId: string): Promise<UserFavorite>;
  removeFavorite(userId: string, placeId: string): Promise<void>;
  isFavorite(userId: string, placeId: string): Promise<boolean>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;

  getFriendshipById(friendshipId: string): Promise<Friendship | undefined>;
  areFriends(userId1: string, userId2: string): Promise<boolean>;
  sendFriendRequest(requesterId: string, addresseeId: string, direction?: string): Promise<Friendship>;
  respondToFriendRequest(
    friendshipId: string,
    status: "accepted" | "rejected",
    direction?: string,
  ): Promise<Friendship>;
  getFriends(userId: string, direction?: string): Promise<User[]>;
  getFriendRequests(userId: string, type: 'sent' | 'received'): Promise<Friendship[]>;
  removeFriend(userId: string, friendId: string): Promise<void>;

  followUser(followerId: string, followingId: string): Promise<UserFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  getPrivateMessages(userId1: string, userId2: string, limit?: number): Promise<PrivateMessage[]>;
  getConversations(userId: string): Promise<{ user: User; lastMessage: PrivateMessage; unreadCount: number }[]>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;

  createTravelPost(post: InsertTravelPost): Promise<TravelPost>;
  getTravelPosts(filters?: {
    userId?: string;
    following?: string;
    tag?: string;
    publicOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<TravelPost[]>;
  getTravelPost(id: string): Promise<TravelPost | undefined>;
  updateTravelPost(id: string, post: Partial<InsertTravelPost>): Promise<TravelPost>;
  deleteTravelPost(id: string): Promise<void>;

  likePost(userId: string, postId: string): Promise<PostLike>;
  unlikePost(userId: string, postId: string): Promise<void>;
  addPostComment(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostComment[]>;
  getPostComment(id: string): Promise<PostComment | undefined>;
  deletePostComment(id: string): Promise<void>;

  searchUsers(
    query: string,
    limit?: number,
    options?: {
      viewerId?: string;
      exact?: boolean;
      direction?: string;
      travelStyle?: string;
    },
  ): Promise<User[]>;

  getPrivacySettings(userId: string): Promise<UserPrivacySettings>;
  updatePrivacySettings(
    userId: string,
    patch: Partial<Omit<UserPrivacySettings, "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserPrivacySettings>;
  touchPresence(userId: string, isOnline: boolean): Promise<UserPresence>;
  getPresence(userId: string): Promise<UserPresence | undefined>;

  ensureLegacyChatRooms(): Promise<void>;
  getChatRoomBySlug(slug: string): Promise<ChatRoom | undefined>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  listChatRoomsForUser(userId: string): Promise<(ChatRoom & { memberCount: number; myRole: string | null })[]>;
  createChatRoom(data: {
    slug?: string;
    title: string;
    description?: string;
    avatarUrl?: string;
    visibility: "public" | "private";
    createdBy: string;
    settings?: ChatRoom["settings"];
  }): Promise<ChatRoom>;
  updateChatRoom(id: string, patch: Partial<Pick<ChatRoom, "title" | "description" | "avatarUrl" | "visibility" | "settings">>): Promise<ChatRoom>;
  getChatRoomMember(roomId: string, userId: string): Promise<ChatRoomMember | undefined>;
  joinChatRoom(roomId: string, userId: string, role?: string): Promise<ChatRoomMember>;
  leaveChatRoom(roomId: string, userId: string): Promise<void>;
  getChatRoomMembers(roomId: string): Promise<(ChatRoomMember & { user: User })[]>;
  setChatRoomMemberRole(roomId: string, userId: string, role: string): Promise<ChatRoomMember>;
  banChatRoomMember(roomId: string, userId: string): Promise<void>;
  createChatRoomInvite(roomId: string, createdBy: string, opts?: { expiresAt?: Date; maxUses?: number }): Promise<ChatRoomInvite & { inviteUrl: string }>;
  joinChatRoomByToken(token: string, userId: string): Promise<ChatRoom>;
  getChatMessage(messageId: string): Promise<import("@shared/schema").ChatMessage | undefined>;
  updateChatMessage(messageId: string, content: string): Promise<import("@shared/schema").ChatMessage | undefined>;
  getChatMessageLikeMeta(
    messageIds: string[],
    viewerId: string,
  ): Promise<Record<string, { likeCount: number; likedByMe: boolean }>>;
  toggleChatMessageLike(messageId: string, userId: string): Promise<{ likeCount: number; likedByMe: boolean }>;
  pinChatMessage(roomId: string, messageId: string, pinnedBy: string): Promise<void>;
  unpinChatMessage(roomId: string, messageId: string): Promise<void>;
  getPinnedMessageIds(roomId: string): Promise<string[]>;
  deleteChatMessage(messageId: string): Promise<void>;
  getPrivateMessage(messageId: string): Promise<import("@shared/schema").PrivateMessage | undefined>;
  updatePrivateMessage(messageId: string, content: string): Promise<import("@shared/schema").PrivateMessage | undefined>;
  deletePrivateMessage(messageId: string): Promise<void>;
  getPrivateMessageLikeMeta(
    messageIds: string[],
    viewerId: string,
  ): Promise<Record<string, { likeCount: number; likedByMe: boolean }>>;
  togglePrivateMessageLike(messageId: string, userId: string): Promise<{ likeCount: number; likedByMe: boolean }>;

  createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string | null;
    actorId?: string | null;
    entityId?: string | null;
  }): Promise<import("@shared/schema").NotificationRow>;
  getNotifications(userId: string, limit?: number): Promise<import("@shared/schema").NotificationRow[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(userId: string, id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  upsertPushSubscription(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void>;
  getPushSubscriptionsForUser(userId: string): Promise<{ endpoint: string; p256dh: string; auth: string }[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

  getPostLikesCount(postId: string): Promise<number>;
  isPostLikedByUser(userId: string, postId: string): Promise<boolean>;
  getPostCommentsCount(postId: string): Promise<number>;
  getUserTrips(userId: string): Promise<Trip[]>;

  deleteUserAccount(userId: string): Promise<void>;
  exportUserData(userId: string): Promise<Record<string, unknown>>;
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private places: Map<string, Place> = new Map();
  private reviews: Map<string, Review> = new Map();
  private trips: Map<string, Trip> = new Map();
  private tripParticipants: Map<string, TripParticipant> = new Map();
  private tripWaypoints: Map<string, TripWaypoint> = new Map();
  private events: Map<string, Event> = new Map();
  private eventRegistrations: Map<string, EventRegistration> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private userFavorites: Map<string, UserFavorite> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private friendships: Map<string, Friendship> = new Map();
  private userFollows: Map<string, UserFollow> = new Map();
  private privateMessages: Map<string, PrivateMessage> = new Map();
  private travelPosts: Map<string, TravelPost> = new Map();
  private postLikes: Map<string, PostLike> = new Map();
  private postComments: Map<string, PostComment> = new Map();
  private privacyByUser: Map<string, UserPrivacySettings> = new Map();
  private presenceByUser: Map<string, UserPresence> = new Map();
  private memChatRooms: Map<string, ChatRoom> = new Map();
  private memChatMembers: Map<string, ChatRoomMember> = new Map();
  private memChatInvites: Map<string, ChatRoomInvite> = new Map();
  private memPinnedMessages: Map<string, { roomId: string; messageId: string }> = new Map();
  private memChatLikes = new Set<string>();
  private memPrivateLikes = new Set<string>();
  private memLegacyRoomsReady = false;
  private memNotifications: Map<string, import("@shared/schema").NotificationRow> = new Map();
  private memPushSubs: Map<string, { userId: string; endpoint: string; p256dh: string; auth: string }> =
    new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const samplePlaces: Place[] = [
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    samplePlaces.forEach(p => this.places.set(p.id, p));

    const now = new Date();
    const sampleEvents: Event[] = [
      {
        id: "event1",
        title: "Tokyo Cherry Blossom Festival",
        description: "Join us for the annual Hanami festival in Ueno Park. Experience the beauty of sakura season with live music, food stalls, and traditional performances.",
        type: "festival",
        location: "Ueno Park, Tokyo, Japan",
        startDate: new Date(now.getTime() + 7 * 24 * 3600000),
        endDate: new Date(now.getTime() + 10 * 24 * 3600000),
        imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800",
        organizerId: null,
        price: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "event2",
        title: "Santorini Photography Workshop",
        description: "A 3-day photography retreat capturing the iconic landscapes of Santorini. Perfect for all skill levels.",
        type: "workshop",
        location: "Oia, Santorini, Greece",
        startDate: new Date(now.getTime() + 14 * 24 * 3600000),
        endDate: new Date(now.getTime() + 17 * 24 * 3600000),
        imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
        organizerId: null,
        price: 29900,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "event3",
        title: "Patagonia Hiking Expedition",
        description: "Epic 10-day trek through Torres del Paine National Park. All experience levels welcome.",
        type: "adventure",
        location: "Torres del Paine, Patagonia, Chile",
        startDate: new Date(now.getTime() + 30 * 24 * 3600000),
        endDate: new Date(now.getTime() + 40 * 24 * 3600000),
        imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800",
        organizerId: null,
        price: 149900,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleEvents.forEach(e => this.events.set(e.id, e));

    const sampleTrips: Trip[] = [
      {
        id: "trip1",
        userId: "demo-user",
        title: "Greek Island Hopping",
        description: "2-week adventure visiting Mykonos, Santorini, Crete, and Rhodes.",
        destination: "Greece",
        startDate: new Date(now.getTime() + 20 * 24 * 3600000),
        endDate: new Date(now.getTime() + 34 * 24 * 3600000),
        maxParticipants: 8,
        currentParticipants: 3,
        budgetMin: 2000,
        budgetMax: 4000,
        tags: ["islands", "Greece", "sailing", "culture"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "trip2",
        userId: "demo-user",
        title: "Japan in Spring",
        description: "2-week cultural journey through Tokyo, Kyoto, Osaka, and Hiroshima during cherry blossom season.",
        destination: "Japan",
        startDate: new Date(now.getTime() + 45 * 24 * 3600000),
        endDate: new Date(now.getTime() + 59 * 24 * 3600000),
        maxParticipants: 6,
        currentParticipants: 2,
        budgetMin: 3000,
        budgetMax: 6000,
        tags: ["Japan", "culture", "food", "temples"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleTrips.forEach(t => this.trips.set(t.id, t));

    const samplePosts: TravelPost[] = [
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
        createdAt: new Date(now.getTime() - 2 * 3600000),
        updatedAt: new Date(now.getTime() - 2 * 3600000),
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
        createdAt: new Date(now.getTime() - 24 * 3600000),
        updatedAt: new Date(now.getTime() - 24 * 3600000),
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
        createdAt: new Date(now.getTime() - 48 * 3600000),
        updatedAt: new Date(now.getTime() - 48 * 3600000),
      },
    ];

    samplePosts.forEach(p => this.travelPosts.set(p.id, p));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const lower = email.trim().toLowerCase();
    return Array.from(this.users.values()).find(
      (u) => u.email?.toLowerCase() === lower
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const lower = username.trim().toLowerCase().replace(/^@/, "");
    return Array.from(this.users.values()).find(
      (u) => u.username?.toLowerCase() === lower,
    );
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
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    const user: User = { ...existing, ...data, updatedAt: new Date() } as User;
    this.users.set(userId, user);
    return user;
  }

  async ensureUsernames(): Promise<void> {
    const { generateUniqueUsername } = await import("./user-utils");
    for (const user of Array.from(this.users.values())) {
      if (user.username || !user.email) continue;
      const username = await generateUniqueUsername(this, user.email);
      await this.updateUserMe(user.id, { username });
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { resolveIsAdmin } = await import("./admin");
    const existing = this.users.get(userData.id as string);
    const user: User = {
      ...existing,
      ...userData,
      isAdmin: resolveIsAdmin(userData.email ?? undefined) || userData.isAdmin === true,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  async setUserAdmin(userId: string, isAdmin: boolean): Promise<User> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    const user: User = { ...existing, isAdmin, updatedAt: new Date() };
    this.users.set(userId, user);
    return user;
  }

  async ensureAdminUsers(): Promise<void> {
    const { getAdminEmails } = await import("./admin");
    for (const email of Array.from(getAdminEmails())) {
      const user = await this.getUserByEmail(email);
      if (user && !user.isAdmin) {
        await this.setUserAdmin(user.id, true);
      }
    }
  }

  async setUserPassword(userId: string, passwordHash: string): Promise<User> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    const user: User = { ...existing, passwordHash, updatedAt: new Date() };
    this.users.set(userId, user);
    return user;
  }

  // Place operations
  async getPlaces(filters?: {
    type?: string;
    search?: string;
    minRating?: number;
    priceRange?: string;
    limit?: number;
    offset?: number;
  }): Promise<Place[]> {
    let results = Array.from(this.places.values());
    if (filters?.type) {
      results = results.filter(p => p.type === filters.type);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (filters?.minRating != null) {
      results = results.filter(p => parseFloat(p.averageRating ?? "0") >= filters.minRating!);
    }
    if (filters?.priceRange) {
      results = results.filter(p => p.priceRange === filters.priceRange);
    }
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }

  async getPlace(id: string): Promise<Place | undefined> {
    return this.places.get(id);
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const id = genId();
    const newPlace: Place = {
      ...place,
      id,
      reviewCount: 0,
      averageRating: null,
      createdAt: new Date(),
    } as Place;
    this.places.set(id, newPlace);
    return newPlace;
  }

  async updatePlace(id: string, place: Partial<InsertPlace>): Promise<Place> {
    const existing = this.places.get(id);
    if (!existing) throw new Error("Place not found");
    const updated = { ...existing, ...place };
    this.places.set(id, updated);
    return updated;
  }

  // Review operations
  async getReviewsByPlace(placeId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.placeId === placeId);
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.userId === userId);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = genId();
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date(),
    } as Review;
    this.reviews.set(id, newReview);
    await this.updatePlaceRating(review.placeId);
    return newReview;
  }

  async updatePlaceRating(placeId: string): Promise<void> {
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
  async getTrips(filters?: {
    userId?: string;
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Trip[]> {
    let results = Array.from(this.trips.values());
    if (filters?.userId) {
      results = results.filter(t => t.userId === filters.userId);
    }
    if (filters?.destination) {
      const q = filters.destination.toLowerCase();
      results = results.filter(t => t.destination?.toLowerCase().includes(q));
    }
    if (filters?.startDate) {
      results = results.filter(t => t.startDate && new Date(t.startDate) >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter(t => t.endDate && new Date(t.endDate) <= filters.endDate!);
    }
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const id = genId();
    const newTrip: Trip = {
      ...trip,
      id,
      currentParticipants: 1,
      createdAt: new Date(),
    } as Trip;
    this.trips.set(id, newTrip);
    return newTrip;
  }

  async joinTrip(tripId: string, userId: string): Promise<TripParticipant> {
    const id = genId();
    const participant: TripParticipant = {
      id,
      tripId,
      userId,
      joinedAt: new Date(),
      status: "confirmed",
    } as TripParticipant;
    this.tripParticipants.set(id, participant);
    const trip = this.trips.get(tripId);
    if (trip) {
      trip.currentParticipants = (trip.currentParticipants ?? 0) + 1;
      this.trips.set(tripId, trip);
    }
    return participant;
  }

  async getTripParticipants(tripId: string): Promise<TripParticipant[]> {
    return Array.from(this.tripParticipants.values()).filter(p => p.tripId === tripId);
  }

  async getTripParticipationsByUser(userId: string): Promise<string[]> {
    return Array.from(this.tripParticipants.values())
      .filter(p => p.userId === userId)
      .map(p => p.tripId);
  }

  async getTripWaypoints(tripId: string): Promise<(TripWaypoint & { place: Place | null })[]> {
    const waypoints = Array.from(this.tripWaypoints.values())
      .filter(w => w.tripId === tripId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return Promise.all(
      waypoints.map(async (w) => {
        const place = await this.getPlace(w.placeId);
        return { ...w, place: place ?? null };
      })
    );
  }

  async addTripWaypoint(tripId: string, placeId: string, orderIndex?: number, dayNumber?: number): Promise<TripWaypoint> {
    const waypoints = Array.from(this.tripWaypoints.values()).filter(w => w.tripId === tripId);
    const nextOrder = orderIndex ?? waypoints.length;
    const id = genId();
    const waypoint: TripWaypoint = {
      id,
      tripId,
      placeId,
      orderIndex: nextOrder,
      dayNumber: dayNumber ?? null,
      createdAt: new Date(),
    } as TripWaypoint;
    this.tripWaypoints.set(id, waypoint);
    return waypoint;
  }

  async getTripWaypoint(waypointId: string): Promise<TripWaypoint | undefined> {
    return this.tripWaypoints.get(waypointId);
  }

  async updateTripWaypoint(
    waypointId: string,
    data: { orderIndex?: number; dayNumber?: number },
  ): Promise<TripWaypoint | undefined> {
    const wp = this.tripWaypoints.get(waypointId);
    if (!wp) return undefined;
    const updated = {
      ...wp,
      ...(data.orderIndex != null ? { orderIndex: data.orderIndex } : {}),
      ...(data.dayNumber != null ? { dayNumber: data.dayNumber } : {}),
    };
    this.tripWaypoints.set(waypointId, updated);
    return updated;
  }

  async removeTripWaypoint(waypointId: string): Promise<void> {
    this.tripWaypoints.delete(waypointId);
  }

  // Event operations
  async getEvents(filters?: {
    type?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    let results = Array.from(this.events.values());
    if (filters?.type) {
      results = results.filter(e => e.type === filters.type);
    }
    if (filters?.upcoming) {
      const now = new Date();
      results = results.filter(e => e.startDate && new Date(e.startDate) > now);
    }
    results.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      return da - db;
    });
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = genId();
    const newEvent: Event = {
      ...event,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Event;
    this.events.set(id, newEvent);
    return newEvent;
  }

  async registerForEvent(eventId: string, userId: string): Promise<EventRegistration> {
    const existing = Array.from(this.eventRegistrations.values()).find(
      (r) => r.eventId === eventId && r.userId === userId,
    );
    if (existing) return existing;
    const id = genId();
    const reg: EventRegistration = { id, eventId, userId, createdAt: new Date() } as EventRegistration;
    this.eventRegistrations.set(id, reg);
    return reg;
  }

  async unregisterFromEvent(eventId: string, userId: string): Promise<void> {
    for (const [key, r] of Array.from(this.eventRegistrations.entries())) {
      if (r.eventId === eventId && r.userId === userId) {
        this.eventRegistrations.delete(key);
      }
    }
  }

  async getRegisteredEventIds(userId: string): Promise<string[]> {
    return Array.from(this.eventRegistrations.values())
      .filter((r) => r.userId === userId)
      .map((r) => r.eventId);
  }

  async isRegisteredForEvent(eventId: string, userId: string): Promise<boolean> {
    return Array.from(this.eventRegistrations.values()).some(
      (r) => r.eventId === eventId && r.userId === userId,
    );
  }

  // Chat operations
  async getChatMessages(chatRoom: string, limit = 50): Promise<ChatMessage[]> {
    const msgs = Array.from(this.chatMessages.values())
      .filter(m => m.chatRoom === chatRoom)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    return msgs.slice(-limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = genId();
    const newMsg: ChatMessage = {
      ...message,
      id,
      createdAt: new Date(),
    } as ChatMessage;
    this.chatMessages.set(id, newMsg);
    return newMsg;
  }

  // Favorites operations
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return Array.from(this.userFavorites.values()).filter(f => f.userId === userId);
  }

  async addFavorite(userId: string, placeId: string): Promise<UserFavorite> {
    const id = genId();
    const fav: UserFavorite = { id, userId, placeId, createdAt: new Date() } as UserFavorite;
    this.userFavorites.set(id, fav);
    return fav;
  }

  async removeFavorite(userId: string, placeId: string): Promise<void> {
    for (const [key, fav] of Array.from(this.userFavorites.entries())) {
      if (fav.userId === userId && fav.placeId === placeId) {
        this.userFavorites.delete(key);
      }
    }
  }

  async isFavorite(userId: string, placeId: string): Promise<boolean> {
    return Array.from(this.userFavorites.values()).some(f => f.userId === userId && f.placeId === placeId);
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userId);
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = genId();
    const newProfile: UserProfile = {
      ...profile,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile;
    this.userProfiles.set(profile.userId!, newProfile);
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existing = this.userProfiles.get(userId);
    if (!existing) {
      return this.createUserProfile({ userId, ...profile } as InsertUserProfile);
    }
    const updated: UserProfile = { ...existing, ...profile, updatedAt: new Date() };
    this.userProfiles.set(userId, updated);
    return updated;
  }

  async getFriendshipById(friendshipId: string): Promise<Friendship | undefined> {
    return this.friendships.get(friendshipId);
  }

  // Friend operations
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    if (userId1 === userId2) return true;
    return Array.from(this.friendships.values()).some(
      (f) =>
        f.status === "accepted" &&
        ((f.requesterId === userId1 && f.addresseeId === userId2) ||
          (f.requesterId === userId2 && f.addresseeId === userId1)),
    );
  }

  async sendFriendRequest(requesterId: string, addresseeId: string, direction?: string): Promise<Friendship> {
    const id = genId();
    const friendship: Friendship = {
      id,
      requesterId,
      addresseeId,
      status: "pending",
      direction: direction ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Friendship;
    this.friendships.set(id, friendship);
    return friendship;
  }

  async respondToFriendRequest(
    friendshipId: string,
    status: "accepted" | "rejected",
    direction?: string,
  ): Promise<Friendship> {
    const friendship = this.friendships.get(friendshipId);
    if (!friendship) throw new Error("Friendship not found");
    const updated: Friendship = {
      ...friendship,
      status,
      direction: direction && status === "accepted" ? direction : friendship.direction,
      updatedAt: new Date(),
    };
    this.friendships.set(friendshipId, updated);
    return updated;
  }

  async getFriends(userId: string, direction?: string): Promise<User[]> {
    const friendIds: string[] = [];
    for (const f of Array.from(this.friendships.values())) {
      if (f.status === "accepted") {
        if (direction && f.direction !== direction) continue;
        if (f.requesterId === userId) friendIds.push(f.addresseeId);
        else if (f.addresseeId === userId) friendIds.push(f.requesterId);
      }
    }
    return friendIds.map((id) => this.users.get(id)).filter(Boolean) as User[];
  }

  async getFriendRequests(userId: string, type: 'sent' | 'received'): Promise<Friendship[]> {
    return Array.from(this.friendships.values()).filter(f => {
      if (type === 'sent') return f.requesterId === userId && f.status === 'pending';
      return f.addresseeId === userId && f.status === 'pending';
    });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    for (const [key, f] of Array.from(this.friendships.entries())) {
      if ((f.requesterId === userId && f.addresseeId === friendId) ||
          (f.requesterId === friendId && f.addresseeId === userId)) {
        this.friendships.delete(key);
      }
    }
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const id = genId();
    const follow: UserFollow = { id, followerId, followingId, createdAt: new Date() } as UserFollow;
    this.userFollows.set(id, follow);
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    for (const [key, f] of Array.from(this.userFollows.entries())) {
      if (f.followerId === followerId && f.followingId === followingId) {
        this.userFollows.delete(key);
      }
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    const ids = Array.from(this.userFollows.values())
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
    return ids.map(id => this.users.get(id)).filter(Boolean) as User[];
  }

  async getFollowing(userId: string): Promise<User[]> {
    const ids = Array.from(this.userFollows.values())
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
    return ids.map(id => this.users.get(id)).filter(Boolean) as User[];
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return Array.from(this.userFollows.values()).some(f => f.followerId === followerId && f.followingId === followingId);
  }

  // Private message operations
  async sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const id = genId();
    const newMsg: PrivateMessage = {
      ...message,
      id,
      isRead: false,
      createdAt: new Date(),
    } as PrivateMessage;
    this.privateMessages.set(id, newMsg);
    return newMsg;
  }

  async getPrivateMessages(userId1: string, userId2: string, limit = 50): Promise<PrivateMessage[]> {
    const msgs = Array.from(this.privateMessages.values())
      .filter(m =>
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    return msgs.slice(-limit);
  }

  async getConversations(userId: string): Promise<{ user: User; lastMessage: PrivateMessage; unreadCount: number }[]> {
    const partnerIds = new Set<string>();
    for (const m of Array.from(this.privateMessages.values())) {
      if (m.senderId === userId) partnerIds.add(m.receiverId!);
      else if (m.receiverId === userId) partnerIds.add(m.senderId!);
    }

    const conversations: { user: User; lastMessage: PrivateMessage; unreadCount: number }[] = [];
    for (const partnerId of Array.from(partnerIds)) {
      const partner = this.users.get(partnerId);
      if (!partner) continue;
      const msgs = await this.getPrivateMessages(userId, partnerId);
      if (msgs.length === 0) continue;
      const lastMessage = msgs[msgs.length - 1];
      const unreadCount = msgs.filter(m => m.receiverId === userId && !m.isRead).length;
      conversations.push({ user: partner, lastMessage, unreadCount });
    }

    return conversations.sort((a, b) =>
      new Date(b.lastMessage.createdAt!).getTime() - new Date(a.lastMessage.createdAt!).getTime()
    );
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    for (const [key, msg] of Array.from(this.privateMessages.entries())) {
      if (msg.receiverId === userId && msg.senderId === senderId && !msg.isRead) {
        this.privateMessages.set(key, { ...msg, isRead: true });
      }
    }
  }

  // Travel post operations
  async createTravelPost(post: InsertTravelPost): Promise<TravelPost> {
    const id = genId();
    const newPost: TravelPost = {
      ...post,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TravelPost;
    this.travelPosts.set(id, newPost);
    return newPost;
  }

  async getTravelPosts(filters?: {
    userId?: string;
    following?: string;
    tag?: string;
    publicOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<TravelPost[]> {
    let results = Array.from(this.travelPosts.values());
    if (filters?.publicOnly) {
      results = results.filter((p) => p.isPublic !== false);
    }
    if (filters?.userId) {
      results = results.filter(p => p.userId === filters.userId);
    }
    if (filters?.following) {
      const followingIds = Array.from(this.userFollows.values())
        .filter(f => f.followerId === filters.following)
        .map(f => f.followingId);
      results = results.filter(p => followingIds.includes(p.userId!));
    }
    if (filters?.tag) {
      const tag = filters.tag.toLowerCase();
      results = results.filter(p => p.tags?.some(t => t.toLowerCase() === tag));
    }
    results.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 20;
    return results.slice(offset, offset + limit);
  }

  async getTravelPost(id: string): Promise<TravelPost | undefined> {
    return this.travelPosts.get(id);
  }

  async updateTravelPost(id: string, post: Partial<InsertTravelPost>): Promise<TravelPost> {
    const existing = this.travelPosts.get(id);
    if (!existing) throw new Error("Post not found");
    const updated: TravelPost = { ...existing, ...post, updatedAt: new Date() };
    this.travelPosts.set(id, updated);
    return updated;
  }

  async deleteTravelPost(id: string): Promise<void> {
    this.travelPosts.delete(id);
  }

  // Post interaction operations
  async likePost(userId: string, postId: string): Promise<PostLike> {
    const id = genId();
    const like: PostLike = { id, userId, postId, createdAt: new Date() } as PostLike;
    this.postLikes.set(id, like);
    return like;
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    for (const [key, like] of Array.from(this.postLikes.entries())) {
      if (like.userId === userId && like.postId === postId) {
        this.postLikes.delete(key);
        break;
      }
    }
  }

  async addPostComment(comment: InsertPostComment): Promise<PostComment> {
    const id = genId();
    const newComment: PostComment = {
      ...comment,
      id,
      createdAt: new Date(),
    } as PostComment;
    this.postComments.set(id, newComment);
    return newComment;
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    return Array.from(this.postComments.values())
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async getPostComment(id: string): Promise<PostComment | undefined> {
    return this.postComments.get(id);
  }

  async deletePostComment(id: string): Promise<void> {
    this.postComments.delete(id);
  }

  // Search operations
  async searchUsers(
    query: string,
    limit = 10,
    options?: { viewerId?: string; exact?: boolean; direction?: string; travelStyle?: string },
  ): Promise<User[]> {
    const q = query.toLowerCase().replace(/^@/, "");
    let list = Array.from(this.users.values());
    if (options?.exact) {
      list = list.filter((u) => u.username?.toLowerCase() === q);
    } else {
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q),
      );
    }
    return list.slice(0, limit);
  }

  async getPrivacySettings(userId: string): Promise<UserPrivacySettings> {
    return (
      this.privacyByUser.get(userId) ?? {
        userId,
        ...DEFAULT_PRIVACY_SETTINGS,
        createdAt: null,
        updatedAt: null,
      }
    );
  }

  async updatePrivacySettings(
    userId: string,
    patch: Partial<Omit<UserPrivacySettings, "userId" | "createdAt" | "updatedAt">>,
  ): Promise<UserPrivacySettings> {
    const current = await this.getPrivacySettings(userId);
    const merged = { ...current, ...patch, updatedAt: new Date() };
    this.privacyByUser.set(userId, merged);
    return merged;
  }

  async touchPresence(userId: string, isOnline: boolean): Promise<UserPresence> {
    const row: UserPresence = { userId, isOnline, lastSeenAt: new Date() };
    this.presenceByUser.set(userId, row);
    return row;
  }

  async getPresence(userId: string): Promise<UserPresence | undefined> {
    return this.presenceByUser.get(userId);
  }

  private ensureMemLegacyRooms(): void {
    if (this.memLegacyRoomsReady) return;
    for (const seed of LEGACY_CHAT_ROOM_SEEDS) {
      const id = genId();
      const room: ChatRoom = {
        id,
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        avatarUrl: null,
        visibility: "public",
        createdBy: null,
        settings: { autoJoinOnPost: true },
        isLegacy: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ChatRoom;
      this.memChatRooms.set(id, room);
    }
    this.memLegacyRoomsReady = true;
  }

  async ensureLegacyChatRooms(): Promise<void> {
    this.ensureMemLegacyRooms();
  }

  async getChatRoomBySlug(slug: string): Promise<ChatRoom | undefined> {
    this.ensureMemLegacyRooms();
    return Array.from(this.memChatRooms.values()).find((r) => r.slug === slug);
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    return this.memChatRooms.get(id);
  }

  async listChatRoomsForUser(userId: string) {
    this.ensureMemLegacyRooms();
    return Array.from(this.memChatRooms.values()).map((room) => ({
      ...room,
      memberCount: Array.from(this.memChatMembers.values()).filter(
        (m) => m.roomId === room.id && m.status === "active",
      ).length,
      myRole:
        Array.from(this.memChatMembers.values()).find((m) => m.roomId === room.id && m.userId === userId)
          ?.role ?? null,
    }));
  }

  async createChatRoom(data: {
    slug?: string;
    title: string;
    description?: string;
    avatarUrl?: string;
    visibility: "public" | "private";
    createdBy: string;
    settings?: ChatRoom["settings"];
  }): Promise<ChatRoom> {
    const id = genId();
    const slug =
      data.slug ??
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 80);
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
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ChatRoom;
    this.memChatRooms.set(id, room);
    await this.joinChatRoom(id, data.createdBy, "owner");
    return room;
  }

  async updateChatRoom(
    id: string,
    patch: Partial<Pick<ChatRoom, "title" | "description" | "avatarUrl" | "visibility" | "settings">>,
  ): Promise<ChatRoom> {
    const room = this.memChatRooms.get(id);
    if (!room) throw new Error("Room not found");
    const updated = { ...room, ...patch, updatedAt: new Date() };
    this.memChatRooms.set(id, updated);
    return updated;
  }

  async getChatRoomMember(roomId: string, userId: string): Promise<ChatRoomMember | undefined> {
    return Array.from(this.memChatMembers.values()).find((m) => m.roomId === roomId && m.userId === userId);
  }

  async joinChatRoom(roomId: string, userId: string, role = "member"): Promise<ChatRoomMember> {
    const existing = await this.getChatRoomMember(roomId, userId);
    if (existing) return { ...existing, status: "active" };
    const id = genId();
    const m = { id, roomId, userId, role, status: "active", joinedAt: new Date() } as ChatRoomMember;
    this.memChatMembers.set(id, m);
    return m;
  }

  async leaveChatRoom(roomId: string, userId: string): Promise<void> {
    for (const [id, m] of Array.from(this.memChatMembers.entries())) {
      if (m.roomId === roomId && m.userId === userId) this.memChatMembers.delete(id);
    }
  }

  async getChatRoomMembers(roomId: string) {
    const members = Array.from(this.memChatMembers.values()).filter(
      (m) => m.roomId === roomId && m.status === "active",
    );
    return members
      .map((m) => ({ ...m, user: this.users.get(m.userId)! }))
      .filter((x) => x.user);
  }

  async setChatRoomMemberRole(roomId: string, userId: string, role: string): Promise<ChatRoomMember> {
    const m = await this.getChatRoomMember(roomId, userId);
    if (!m) throw new Error("Member not found");
    const updated = { ...m, role };
    this.memChatMembers.set(m.id, updated);
    return updated;
  }

  async banChatRoomMember(roomId: string, userId: string): Promise<void> {
    const m = await this.getChatRoomMember(roomId, userId);
    if (m) this.memChatMembers.set(m.id, { ...m, status: "banned" });
  }

  async createChatRoomInvite(roomId: string, createdBy: string, opts?: { expiresAt?: Date; maxUses?: number }) {
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
      createdAt: new Date(),
    } as ChatRoomInvite;
    this.memChatInvites.set(id, row);
    return { ...row, inviteUrl: `/chat/join/${token}` };
  }

  async joinChatRoomByToken(token: string, userId: string): Promise<ChatRoom> {
    const invite = Array.from(this.memChatInvites.values()).find((i) => i.token === token);
    if (!invite) throw new Error("Invalid invite");
    const room = this.memChatRooms.get(invite.roomId);
    if (!room) throw new Error("Room not found");
    await this.joinChatRoom(room.id, userId);
    return room;
  }

  async getChatMessage(messageId: string): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(messageId);
  }

  async updateChatMessage(messageId: string, content: string): Promise<ChatMessage | undefined> {
    const msg = this.chatMessages.get(messageId);
    if (!msg) return undefined;
    const updated = { ...msg, content, updatedAt: new Date() };
    this.chatMessages.set(messageId, updated);
    return updated;
  }

  async getChatMessageLikeMeta(messageIds: string[], viewerId: string) {
    const out: Record<string, { likeCount: number; likedByMe: boolean }> = {};
    for (const id of messageIds) {
      const likes = Array.from(this.memChatLikes).filter((k) => k.startsWith(`${id}:`));
      out[id] = {
        likeCount: likes.length,
        likedByMe: this.memChatLikes.has(`${id}:${viewerId}`),
      };
    }
    return out;
  }

  async toggleChatMessageLike(messageId: string, userId: string) {
    const key = `${messageId}:${userId}`;
    if (this.memChatLikes.has(key)) this.memChatLikes.delete(key);
    else this.memChatLikes.add(key);
    const meta = await this.getChatMessageLikeMeta([messageId], userId);
    return meta[messageId] ?? { likeCount: 0, likedByMe: false };
  }

  async pinChatMessage(roomId: string, messageId: string, _pinnedBy: string): Promise<void> {
    this.memPinnedMessages.set(`${roomId}:${messageId}`, { roomId, messageId });
  }

  async unpinChatMessage(roomId: string, messageId: string): Promise<void> {
    this.memPinnedMessages.delete(`${roomId}:${messageId}`);
  }

  async getPinnedMessageIds(roomId: string): Promise<string[]> {
    return Array.from(this.memPinnedMessages.values())
      .filter((p) => p.roomId === roomId)
      .map((p) => p.messageId);
  }

  async deleteChatMessage(messageId: string): Promise<void> {
    this.chatMessages.delete(messageId);
    for (const key of Array.from(this.memChatLikes)) {
      if (key.startsWith(`${messageId}:`)) this.memChatLikes.delete(key);
    }
  }

  async getPrivateMessage(messageId: string): Promise<PrivateMessage | undefined> {
    return this.privateMessages.get(messageId);
  }

  async updatePrivateMessage(messageId: string, content: string): Promise<PrivateMessage | undefined> {
    const msg = this.privateMessages.get(messageId);
    if (!msg) return undefined;
    const updated = { ...msg, content, updatedAt: new Date() };
    this.privateMessages.set(messageId, updated);
    return updated;
  }

  async deletePrivateMessage(messageId: string): Promise<void> {
    this.privateMessages.delete(messageId);
    for (const key of Array.from(this.memPrivateLikes)) {
      if (key.startsWith(`${messageId}:`)) this.memPrivateLikes.delete(key);
    }
  }

  async getPrivateMessageLikeMeta(messageIds: string[], viewerId: string) {
    const out: Record<string, { likeCount: number; likedByMe: boolean }> = {};
    for (const id of messageIds) {
      const likes = Array.from(this.memPrivateLikes).filter((k) => k.startsWith(`${id}:`));
      out[id] = {
        likeCount: likes.length,
        likedByMe: this.memPrivateLikes.has(`${id}:${viewerId}`),
      };
    }
    return out;
  }

  async togglePrivateMessageLike(messageId: string, userId: string) {
    const key = `${messageId}:${userId}`;
    if (this.memPrivateLikes.has(key)) this.memPrivateLikes.delete(key);
    else this.memPrivateLikes.add(key);
    const meta = await this.getPrivateMessageLikeMeta([messageId], userId);
    return meta[messageId] ?? { likeCount: 0, likedByMe: false };
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string | null;
    actorId?: string | null;
    entityId?: string | null;
  }): Promise<import("@shared/schema").NotificationRow> {
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
      createdAt: new Date(),
    } as import("@shared/schema").NotificationRow;
    this.memNotifications.set(id, row);
    return row;
  }

  async getNotifications(userId: string, limit = 50) {
    return Array.from(this.memNotifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getUnreadNotificationCount(userId: string) {
    return Array.from(this.memNotifications.values()).filter(
      (n) => n.userId === userId && !n.isRead,
    ).length;
  }

  async markNotificationRead(userId: string, id: string) {
    const n = this.memNotifications.get(id);
    if (n && n.userId === userId) this.memNotifications.set(id, { ...n, isRead: true });
  }

  async markAllNotificationsRead(userId: string) {
    for (const [id, n] of Array.from(this.memNotifications.entries())) {
      if (n.userId === userId) this.memNotifications.set(id, { ...n, isRead: true });
    }
  }

  async upsertPushSubscription(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    this.memPushSubs.set(sub.endpoint, {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    });
  }

  async getPushSubscriptionsForUser(userId: string) {
    return Array.from(this.memPushSubs.values()).filter((s) => s.userId === userId);
  }

  async deletePushSubscription(endpoint: string) {
    this.memPushSubs.delete(endpoint);
  }

  async getPostLikesCount(postId: string): Promise<number> {
    return Array.from(this.postLikes.values()).filter(l => l.postId === postId).length;
  }

  async isPostLikedByUser(userId: string, postId: string): Promise<boolean> {
    return Array.from(this.postLikes.values()).some(l => l.userId === userId && l.postId === postId);
  }

  async getPostCommentsCount(postId: string): Promise<number> {
    return Array.from(this.postComments.values()).filter(c => c.postId === postId).length;
  }

  async getUserTrips(userId: string): Promise<Trip[]> {
    return this.getTrips({ userId });
  }

  async deleteUserAccount(userId: string): Promise<void> {
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

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const { passwordHash: _pw, ...userSafe } = user;
    return {
      exportedAt: new Date().toISOString(),
      user: userSafe,
      profile: this.userProfiles.get(userId) ?? null,
      trips: await this.getUserTrips(userId),
      posts: await this.getTravelPosts({ userId }),
      reviews: await this.getReviewsByUser(userId),
      favorites: await this.getUserFavorites(userId),
    };
  }
}

export async function initAppStorage(): Promise<void> {
  const { setNotificationStorage } = await import("./notification-service");
  setNotificationStorage(storage);
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

function createStorage(): IStorage {
  if (isDatabaseConfigured() && getDb()) {
    return new PgStorage();
  }
  return new MemStorage();
}

export const storage = createStorage();
