import { z } from "zod";

/** Authorized AI tools only — never unrestricted DB access. */

export const suggestStopsProposalSchema = z.object({
  tool: z.literal("suggest_stops"),
  destination: z.string().min(1),
  summary: z.string(),
  suggestions: z.array(
    z.object({
      placeId: z.string(),
      name: z.string(),
      type: z.string(),
      reason: z.string(),
    }),
  ),
});

export const companionMatchProposalSchema = z.object({
  tool: z.literal("companion_match"),
  tripId: z.string(),
  matches: z.array(
    z.object({
      userId: z.string(),
      username: z.string().nullable(),
      displayName: z.string().nullable(),
      compatibilityScore: z.number(),
      sharedDestinations: z.array(z.string()),
    }),
  ),
});

export type AiToolName = "suggest_stops" | "companion_match" | "apply_stops_to_trip";

export type StructuredProposal = {
  tool: AiToolName;
  payload: Record<string, unknown>;
};

const ALLOWED_TOOLS = new Set<AiToolName>([
  "suggest_stops",
  "companion_match",
  "apply_stops_to_trip",
]);

export function isAuthorizedTool(name: string): name is AiToolName {
  return ALLOWED_TOOLS.has(name as AiToolName);
}

export function assertAuthorizedTool(name: string): asserts name is AiToolName {
  if (!isAuthorizedTool(name)) {
    throw new Error(`Unauthorized AI tool: ${name}`);
  }
}
