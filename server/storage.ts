import {
  users,
  places,
  reviews,
  trips,
  tripParticipants,
  events,
  chatMessages,
  userFavorites,
  type User,
  type UpsertUser,
  type Place,
  type InsertPlace,
  type Review,
  type InsertReview,
  type Trip,
  type InsertTrip,
  type TripParticipant,
  type Event,
  type InsertEvent,
  type ChatMessage,
  type InsertChatMessage,
  type UserFavorite,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Place operations
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

  // Review operations
  getReviewsByPlace(placeId: string): Promise<Review[]>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updatePlaceRating(placeId: string): Promise<void>;

  // Trip operations
  getTrips(filters?: {
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

  // Event operations
  getEvents(filters?: {
    type?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Chat operations
  getChatMessages(chatRoom: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<UserFavorite[]>;
  addFavorite(userId: string, placeId: string): Promise<UserFavorite>;
  removeFavorite(userId: string, placeId: string): Promise<void>;
  isFavorite(userId: string, placeId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
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
    let query = db.select().from(places);
    
    const conditions = [];
    
    if (filters?.type) {
      conditions.push(eq(places.type, filters.type));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(places.name, `%${filters.search}%`),
          ilike(places.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.minRating) {
      conditions.push(sql`${places.averageRating} >= ${filters.minRating}`);
    }
    
    if (filters?.priceRange) {
      conditions.push(eq(places.priceRange, filters.priceRange));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(places.averageRating));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getPlace(id: string): Promise<Place | undefined> {
    const [place] = await db.select().from(places).where(eq(places.id, id));
    return place;
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const [newPlace] = await db.insert(places).values(place).returning();
    return newPlace;
  }

  async updatePlace(id: string, place: Partial<InsertPlace>): Promise<Place> {
    const [updatedPlace] = await db
      .update(places)
      .set({ ...place, updatedAt: new Date() })
      .where(eq(places.id, id))
      .returning();
    return updatedPlace;
  }

  // Review operations
  async getReviewsByPlace(placeId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.placeId, placeId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    await this.updatePlaceRating(review.placeId);
    return newReview;
  }

  async updatePlaceRating(placeId: string): Promise<void> {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
        reviewCount: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.placeId, placeId));

    if (result[0]) {
      await db
        .update(places)
        .set({
          averageRating: result[0].avgRating?.toString() || "0",
          reviewCount: result[0].reviewCount,
        })
        .where(eq(places.id, placeId));
    }
  }

  // Trip operations
  async getTrips(filters?: {
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Trip[]> {
    let query = db.select().from(trips).where(eq(trips.isActive, true));
    
    const conditions = [eq(trips.isActive, true)];
    
    if (filters?.destination) {
      conditions.push(ilike(trips.destination, `%${filters.destination}%`));
    }
    
    if (filters?.startDate) {
      conditions.push(sql`${trips.startDate} >= ${filters.startDate}`);
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${trips.endDate} <= ${filters.endDate}`);
    }
    
    query = query.where(and(...conditions)).orderBy(asc(trips.startDate));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    // Add creator as first participant
    await db.insert(tripParticipants).values({
      tripId: newTrip.id,
      userId: trip.userId,
      status: "accepted",
    });
    return newTrip;
  }

  async joinTrip(tripId: string, userId: string): Promise<TripParticipant> {
    const [participant] = await db
      .insert(tripParticipants)
      .values({
        tripId,
        userId,
        status: "pending",
      })
      .returning();
    return participant;
  }

  async getTripParticipants(tripId: string): Promise<TripParticipant[]> {
    return await db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.tripId, tripId));
  }

  // Event operations
  async getEvents(filters?: {
    type?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    let query = db.select().from(events).where(eq(events.isActive, true));
    
    const conditions = [eq(events.isActive, true)];
    
    if (filters?.type) {
      conditions.push(eq(events.type, filters.type));
    }
    
    if (filters?.upcoming) {
      conditions.push(sql`${events.startDate} > NOW()`);
    }
    
    query = query.where(and(...conditions)).orderBy(asc(events.startDate));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  // Chat operations
  async getChatMessages(chatRoom: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoom, chatRoom))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Favorites operations
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));
  }

  async addFavorite(userId: string, placeId: string): Promise<UserFavorite> {
    const [favorite] = await db
      .insert(userFavorites)
      .values({ userId, placeId })
      .returning();
    return favorite;
  }

  async removeFavorite(userId: string, placeId: string): Promise<void> {
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.placeId, placeId)
        )
      );
  }

  async isFavorite(userId: string, placeId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.placeId, placeId)
        )
      );
    return !!favorite;
  }
}

export const storage = new DatabaseStorage();
