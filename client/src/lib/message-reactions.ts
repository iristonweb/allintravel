import type { ReactionSummary, MessageDeliveryStatus } from "@shared/schema";

export const QUICK_REACTION_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮", "😢", "🎉", "👏"] as const;

export const DEFAULT_REACTION = "❤️";

export function findMyReaction(reactions: ReactionSummary[] | undefined): string | null {
  return reactions?.find((r) => r.reactedByMe)?.emoji ?? null;
}

export function toggleReactionEmoji(current: string | null, emoji: string): string | null {
  return current === emoji ? null : emoji;
}

export type { ReactionSummary, MessageDeliveryStatus };
