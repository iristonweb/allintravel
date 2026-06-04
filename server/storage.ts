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
} from "@shared/schema";
import { getDb, isDatabaseConfigured } from "./db";
import { PgStorage } from "./pg-storage";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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

  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  respondToFriendRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<Friendship>;
  getFriends(userId: string): Promise<User[]>;
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

  searchUsers(query: string, limit?: number): Promise<User[]>;

  getPostLikesCount(postId: string): Promise<number>;
  isPostLikedByUser(userId: string, postId: string): Promise<boolean>;
  getPostCommentsCount(postId: string): Promise<number>;
  getUserTrips(userId: string): Promise<Trip[]>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id as string);
    const user: User = {
      ...existing,
      ...userData,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, user);
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

  // Friend operations
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const id = genId();
    const friendship: Friendship = {
      id,
      requesterId,
      addresseeId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Friendship;
    this.friendships.set(id, friendship);
    return friendship;
  }

  async respondToFriendRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<Friendship> {
    const friendship = this.friendships.get(friendshipId);
    if (!friendship) throw new Error("Friendship not found");
    const updated: Friendship = { ...friendship, status, updatedAt: new Date() };
    this.friendships.set(friendshipId, updated);
    return updated;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendIds: string[] = [];
    for (const f of Array.from(this.friendships.values())) {
      if (f.status === "accepted") {
        if (f.requesterId === userId) friendIds.push(f.addresseeId);
        else if (f.addresseeId === userId) friendIds.push(f.requesterId);
      }
    }
    return friendIds.map(id => this.users.get(id)).filter(Boolean) as User[];
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
    limit?: number;
    offset?: number;
  }): Promise<TravelPost[]> {
    let results = Array.from(this.travelPosts.values());
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
  async searchUsers(query: string, limit = 10): Promise<User[]> {
    const q = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(u =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
      .slice(0, limit);
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
}

export async function initAppStorage(): Promise<void> {
  if (storage instanceof PgStorage) {
    try {
      await storage.ensureSeeded();
    } catch (error) {
      console.error("ensureSeeded failed (app will continue):", error);
    }
  }
}

function createStorage(): IStorage {
  if (isDatabaseConfigured() && getDb()) {
    return new PgStorage();
  }
  return new MemStorage();
}

export const storage = createStorage();
