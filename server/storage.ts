import {
  users,
  places,
  reviews,
  trips,
  tripParticipants,
  events,
  chatMessages,
  userFavorites,
  friendships,
  userFollows,
  privateMessages,
  travelPosts,
  postLikes,
  postComments,
  userProfiles,
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

  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;

  // Friend operations
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  respondToFriendRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<Friendship>;
  getFriends(userId: string): Promise<User[]>;
  getFriendRequests(userId: string, type: 'sent' | 'received'): Promise<Friendship[]>;
  removeFriend(userId: string, friendId: string): Promise<void>;

  // Follow operations
  followUser(followerId: string, followingId: string): Promise<UserFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  // Private message operations
  sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  getPrivateMessages(userId1: string, userId2: string, limit?: number): Promise<PrivateMessage[]>;
  getConversations(userId: string): Promise<{ user: User; lastMessage: PrivateMessage; unreadCount: number }[]>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;

  // Travel post operations
  createTravelPost(post: InsertTravelPost): Promise<TravelPost>;
  getTravelPosts(filters?: {
    userId?: string;
    following?: string;
    limit?: number;
    offset?: number;
  }): Promise<TravelPost[]>;
  getTravelPost(id: string): Promise<TravelPost | undefined>;
  updateTravelPost(id: string, post: Partial<InsertTravelPost>): Promise<TravelPost>;
  deleteTravelPost(id: string): Promise<void>;

  // Post interaction operations
  likePost(userId: string, postId: string): Promise<PostLike>;
  unlikePost(userId: string, postId: string): Promise<void>;
  addPostComment(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostComment[]>;
  deletePostComment(id: string): Promise<void>;

  // Search operations
  searchUsers(query: string, limit?: number): Promise<User[]>;
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

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Friend operations
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({ requesterId, addresseeId, status: "pending" })
      .returning();
    return friendship;
  }

  async respondToFriendRequest(friendshipId: string, status: 'accepted' | 'rejected'): Promise<Friendship> {
    const [friendship] = await db
      .update(friendships)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return friendship;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendsData = await db
      .select({
        user: users,
      })
      .from(friendships)
      .innerJoin(users, 
        or(
          and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
          and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId))
        )
      )
      .where(eq(friendships.status, "accepted"));
    
    return friendsData.map(f => f.user);
  }

  async getFriendRequests(userId: string, type: 'sent' | 'received'): Promise<Friendship[]> {
    const condition = type === 'sent' 
      ? eq(friendships.requesterId, userId)
      : eq(friendships.addresseeId, userId);
    
    return await db
      .select()
      .from(friendships)
      .where(and(condition, eq(friendships.status, "pending")));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
            and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId))
          )
        )
      );
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const [follow] = await db
      .insert(userFollows)
      .values({ followerId, followingId })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followersData = await db
      .select({ user: users })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId));
    
    return followersData.map(f => f.user);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const followingData = await db
      .select({ user: users })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId));
    
    return followingData.map(f => f.user);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
    return !!follow;
  }

  // Private message operations
  async sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const [newMessage] = await db
      .insert(privateMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getPrivateMessages(userId1: string, userId2: string, limit: number = 50): Promise<PrivateMessage[]> {
    return await db
      .select()
      .from(privateMessages)
      .where(
        or(
          and(eq(privateMessages.senderId, userId1), eq(privateMessages.receiverId, userId2)),
          and(eq(privateMessages.senderId, userId2), eq(privateMessages.receiverId, userId1))
        )
      )
      .orderBy(desc(privateMessages.createdAt))
      .limit(limit);
  }

  async getConversations(userId: string): Promise<{ user: User; lastMessage: PrivateMessage; unreadCount: number }[]> {
    // Get latest message for each conversation
    const conversations = await db
      .select({
        otherUserId: sql<string>`CASE 
          WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.receiverId}
          ELSE ${privateMessages.senderId}
        END`,
        lastMessage: privateMessages,
      })
      .from(privateMessages)
      .where(
        or(
          eq(privateMessages.senderId, userId),
          eq(privateMessages.receiverId, userId)
        )
      )
      .orderBy(desc(privateMessages.createdAt));

    // Group by other user and get latest message
    const conversationMap = new Map();
    for (const conv of conversations) {
      if (!conversationMap.has(conv.otherUserId)) {
        conversationMap.set(conv.otherUserId, conv.lastMessage);
      }
    }

    // Get user details and unread counts
    const result = [];
    for (const [otherUserId, lastMessage] of conversationMap) {
      const [user] = await db.select().from(users).where(eq(users.id, otherUserId));
      const [unreadResult] = await db
        .select({ count: count() })
        .from(privateMessages)
        .where(
          and(
            eq(privateMessages.senderId, otherUserId),
            eq(privateMessages.receiverId, userId),
            eq(privateMessages.isRead, false)
          )
        );
      
      if (user) {
        result.push({
          user,
          lastMessage,
          unreadCount: unreadResult?.count || 0,
        });
      }
    }

    return result;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(privateMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(privateMessages.receiverId, userId),
          eq(privateMessages.senderId, senderId),
          eq(privateMessages.isRead, false)
        )
      );
  }

  // Travel post operations
  async createTravelPost(post: InsertTravelPost): Promise<TravelPost> {
    const [newPost] = await db
      .insert(travelPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async getTravelPosts(filters?: {
    userId?: string;
    following?: string;
    limit?: number;
    offset?: number;
  }): Promise<TravelPost[]> {
    let query = db.select().from(travelPosts);
    
    const conditions = [eq(travelPosts.isPublic, true)];
    
    if (filters?.userId) {
      conditions.push(eq(travelPosts.userId, filters.userId));
    }
    
    if (filters?.following) {
      // Get posts from users that the current user follows
      const followingUsers = await db
        .select({ userId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, filters.following));
      
      const followingIds = followingUsers.map(f => f.userId);
      if (followingIds.length > 0) {
        conditions.push(sql`${travelPosts.userId} IN (${followingIds.join(',')})`);
      }
    }
    
    query = query.where(and(...conditions)).orderBy(desc(travelPosts.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getTravelPost(id: string): Promise<TravelPost | undefined> {
    const [post] = await db
      .select()
      .from(travelPosts)
      .where(eq(travelPosts.id, id));
    return post;
  }

  async updateTravelPost(id: string, post: Partial<InsertTravelPost>): Promise<TravelPost> {
    const [updatedPost] = await db
      .update(travelPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(travelPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteTravelPost(id: string): Promise<void> {
    await db.delete(travelPosts).where(eq(travelPosts.id, id));
  }

  // Post interaction operations
  async likePost(userId: string, postId: string): Promise<PostLike> {
    const [like] = await db
      .insert(postLikes)
      .values({ userId, postId })
      .returning();
    return like;
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        )
      );
  }

  async addPostComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db
      .insert(postComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    return await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));
  }

  async deletePostComment(id: string): Promise<void> {
    await db.delete(postComments).where(eq(postComments.id, id));
  }

  // Search operations
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      )
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
