import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { isAuthenticated } from "../../auth";
import { storage } from "../../storage";
import { userCanManageTrip } from "../../security";
import { getDb } from "../../db";
import { ensurePlatformSchema } from "../../platform-schema";
import { generateTripCopilotPlan } from "../../ai/trip-copilot";
import type { CopilotResult } from "../../ai/trip-copilot";

type CopilotMessage = { role: "user" | "assistant"; content: string };

const memSessions = new Map<string, CopilotMessage[]>();

async function getSessionMessages(sessionId: string): Promise<CopilotMessage[]> {
  const db = getDb();
  if (db) {
    const res = await db.execute(sql`
      SELECT messages FROM ai_copilot_sessions WHERE id = ${sessionId}
    `);
    const raw = (res as unknown as { rows?: { messages: CopilotMessage[] }[] }).rows?.[0]?.messages;
    return Array.isArray(raw) ? raw : [];
  }
  return memSessions.get(sessionId) ?? [];
}

async function saveSessionMessages(
  sessionId: string,
  userId: string,
  tripId: string,
  messages: CopilotMessage[],
): Promise<void> {
  const db = getDb();
  if (db) {
    await db.execute(sql`
      UPDATE ai_copilot_sessions
      SET messages = ${JSON.stringify(messages)}::jsonb, updated_at = now()
      WHERE id = ${sessionId}
    `);
    return;
  }
  memSessions.set(sessionId, messages);
  void userId;
  void tripId;
}

async function getOrCreateSession(userId: string, tripId: string): Promise<string> {
  await ensurePlatformSchema();
  const db = getDb();
  if (db) {
    const existing = await db.execute(sql`
      SELECT id FROM ai_copilot_sessions WHERE user_id = ${userId} AND trip_id = ${tripId}
      ORDER BY updated_at DESC LIMIT 1
    `);
    const id = (existing as unknown as { rows?: { id: string }[] }).rows?.[0]?.id;
    if (id) return id;
    const created = await db.execute(sql`
      INSERT INTO ai_copilot_sessions (user_id, trip_id, messages)
      VALUES (${userId}, ${tripId}, '[]'::jsonb)
      RETURNING id
    `);
    return String(
      (created as unknown as { rows?: { id: string }[] }).rows?.[0]?.id ?? crypto.randomUUID(),
    );
  }
  const key = `${userId}:${tripId}`;
  if (!memSessions.has(key)) memSessions.set(key, []);
  return key;
}

export type CompanionMatch = {
  userId: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  compatibilityScore: number;
  sharedDestinations: string[];
};

function compatibilityScore(
  myTags: string[],
  theirTags: string[],
  sameDestination: boolean,
): number {
  const shared = myTags.filter((t) => theirTags.includes(t)).length;
  let score = 40 + shared * 12;
  if (sameDestination) score += 25;
  return Math.min(98, score);
}

export async function findCompanionMatches(
  storage: typeof import("../../storage").storage,
  userId: string,
  tripId: string,
): Promise<CompanionMatch[]> {
  const trip = await storage.getTrip(tripId);
  if (!trip) return [];
  const myProfile = await storage.getUserProfile(userId);
  const myTags = myProfile?.interests ?? myProfile?.favoriteDestinations ?? [];

  const friends = await storage.getFriends(userId);
  const matches: CompanionMatch[] = [];

  for (const friend of friends.slice(0, 20)) {
    if (!friend?.id || friend.id === userId) continue;
    const theirProfile = await storage.getUserProfile(friend.id);
    const theirTags = theirProfile?.interests ?? theirProfile?.favoriteDestinations ?? [];
    const theirTrips = await storage.getTrips({ userId: friend.id, limit: 10 });
    const sharedDestinations = theirTrips
      .filter((t) => t.destination.toLowerCase() === trip.destination.toLowerCase())
      .map((t) => t.destination);

    matches.push({
      userId: friend.id,
      username: friend.username ?? null,
      displayName: friend.displayName ?? friend.firstName ?? null,
      profileImageUrl: friend.profileImageUrl ?? null,
      compatibilityScore: compatibilityScore(
        myTags,
        theirTags,
        sharedDestinations.length > 0,
      ),
      sharedDestinations,
    });
  }

  return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 8);
}

export function registerAiRoutes(app: Express): void {
  app.post("/api/trips/:id/copilot/chat", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      if (!(await userCanManageTrip(storage, userId, req.params.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });

      const prompt = String(req.body?.prompt ?? "").trim();
      if (!prompt) return res.status(400).json({ message: "Prompt required" });

      const sessionId = await getOrCreateSession(userId, trip.id);
      const history = await getSessionMessages(sessionId);
      history.push({ role: "user", content: prompt });

      const contextPrefix = history
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      const plan: CopilotResult = await generateTripCopilotPlan(
        storage,
        trip.destination,
        `${contextPrefix}\nuser: ${prompt}`,
      );

      history.push({ role: "assistant", content: plan.summary });
      await saveSessionMessages(sessionId, userId, trip.id, history);

      res.json({ sessionId, ...plan, messages: history });
    } catch (error) {
      console.error("copilot/chat:", error);
      res.status(500).json({ message: "Copilot chat failed" });
    }
  });

  app.get("/api/trips/:id/companion-matches", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const matches = await findCompanionMatches(storage, userId, req.params.id);
      res.json({ matches });
    } catch (error) {
      console.error("companion-matches:", error);
      res.status(500).json({ message: "Failed to find companions" });
    }
  });
}
