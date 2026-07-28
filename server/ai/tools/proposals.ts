import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { assertAuthorizedTool, type AiToolName } from "./registry";
import { incr, MetricNames } from "../../observability/metrics";
import type { IStorage } from "../../storage";
import type { CopilotSuggestion } from "../trip-copilot";

function genId(): string {
  return `prop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const memProposals = new Map<
  string,
  {
    id: string;
    userId: string;
    tripId: string | null;
    toolName: string;
    proposal: Record<string, unknown>;
    status: string;
  }
>();

export async function createProposal(opts: {
  userId: string;
  tripId: string | null;
  toolName: AiToolName;
  proposal: Record<string, unknown>;
}): Promise<{ id: string; status: "pending" }> {
  assertAuthorizedTool(opts.toolName);
  const id = genId();
  const db = getDb();
  if (db) {
    try {
      await db.execute(sql`
        INSERT INTO ai_proposals (id, user_id, trip_id, tool_name, proposal, status)
        VALUES (
          ${id},
          ${opts.userId},
          ${opts.tripId},
          ${opts.toolName},
          ${JSON.stringify(opts.proposal)}::jsonb,
          'pending'
        )
      `);
      incr(MetricNames.aiProposals);
      return { id, status: "pending" };
    } catch {
      // fall through to mem
    }
  }
  memProposals.set(id, {
    id,
    userId: opts.userId,
    tripId: opts.tripId,
    toolName: opts.toolName,
    proposal: opts.proposal,
    status: "pending",
  });
  incr(MetricNames.aiProposals);
  return { id, status: "pending" };
}

export async function getProposal(id: string) {
  const mem = memProposals.get(id);
  if (mem) return mem;
  const db = getDb();
  if (!db) return null;
  try {
    const res = await db.execute(sql`
      SELECT id, user_id, trip_id, tool_name, proposal, status
      FROM ai_proposals WHERE id = ${id}
    `);
    const row = (res as unknown as { rows?: Record<string, unknown>[] }).rows?.[0];
    if (!row) return null;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      tripId: row.trip_id ? String(row.trip_id) : null,
      toolName: String(row.tool_name),
      proposal:
        typeof row.proposal === "string"
          ? (JSON.parse(row.proposal) as Record<string, unknown>)
          : (row.proposal as Record<string, unknown>),
      status: String(row.status),
    };
  } catch {
    return null;
  }
}

export async function decideProposal(
  id: string,
  userId: string,
  decision: "approved" | "rejected",
  storage: IStorage,
): Promise<{ status: string; applied?: boolean }> {
  const proposal = await getProposal(id);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.userId !== userId) throw new Error("Forbidden");
  if (proposal.status !== "pending") throw new Error("Already decided");

  const db = getDb();
  if (db) {
    try {
      await db.execute(sql`
        UPDATE ai_proposals SET status = ${decision}, decided_at = now() WHERE id = ${id}
      `);
    } catch {
      // mem already updated below if needed
    }
  }
  proposal.status = decision;
  memProposals.set(id, proposal);

  if (decision !== "approved") return { status: decision };

  if (proposal.toolName === "apply_stops_to_trip" || proposal.toolName === "suggest_stops") {
    const tripId = proposal.tripId;
    if (!tripId) return { status: decision, applied: false };
    const suggestions = (proposal.proposal.suggestions ?? []) as CopilotSuggestion[];
    let order = 0;
    for (const s of suggestions.slice(0, 12)) {
      try {
        await storage.addTripWaypoint(tripId, s.placeId, order++);
      } catch {
        // place may already be on trip
      }
    }
    return { status: decision, applied: true };
  }

  return { status: decision, applied: false };
}

export function resetProposalsForTests(): void {
  memProposals.clear();
}
